import BaseNode from './base-node.js'
import ContactList from './contact-list.js'
import { getBucketIndex, isKeyStringValid, randomIntFromInterval } from './utils.js'
import cron from 'node-cron'


class KademliaNode extends BaseNode {
    constructor(options) {
        super(options)
        
        // Message queue holds the unsettled messages this node has sent out and for which it is awaiting a reply.
        // The key for a message is the GUID of the message. 
        // TODO If a message is unsettled the node that it was sent to should be remove
        this.messageQueue = new Map()
        this.contacts = new ContactList()
        this.messageScheduler = cron.schedule("* * * * *", () => { 
            this._runMessageQueueWorker()
            
        }) // Every minute of everyday...
        this.refreshScheduler = cron.schedule("*/3 * * * *", () => { 
            this._runBucketRefreshWorker()
            
        })


        this.on("FIND_NODE", (req) => this._iterativeFindNode(req.message.payload.result.key, req.message.payload.result.k, true))
        this.on("FIND_VALUE", (req) => this._iterativeFindNode(req.message.payload.result.key, req.message.payload.result.k, false)) // Don't exclude exact matches
        this.on("PING", (req) => this.router.addContactByNodeId(req.message.payload.result.nodeId, req.contact))

        this.on('messageReady', (req) => {
            switch (req.message.type) {

                case 'request':

                    this[req.message.payload.method](req)

                    break;

                case 'success':
                    
                    if (this.messageQueue.has(req.message.payload.id)) {

                        let msg = this.messageQueue.get(req.message.payload.id)

                        if (msg.settled == false) {

                            msg.settled = true
                            this.messageQueue.set(req.message.payload.id, msg) // Worker will come and remove settled messages
                            this.emit(JSON.parse(msg.rpc).method, req)
                                
                        }
                    }
                    
                    break;
            
                default:
                    // Simply drop the message
                    break;
            }
        })

        this.messageScheduler.start()
        this.refreshScheduler.start()

    }

    /**
     * The node is requesting to join a network. First it will add the provided bootstrap node information to
     * its routing table. It will then send a FIND_NODE rpc to the bootstrap node passing in its own id.
     * The bootstrap node will return k closest neighbours to this joining node. 
     * TODO Once complete, this joining node should refresh each bucket further than its closest neighbout
     * @public
     * @param {string | buffer} peer the id and address of the bootstrap node
     */
    join([id, contact]) {
        if (isKeyStringValid(id)) {

            // Add bootstrap node to router->bucket
            this.router.addContactByNodeId(id, contact)
            
            // Create the RPC
            const joinRPC = this.createRequest("FIND_NODE", { nodeId: this.identity.toString('hex'), contact: this.address })

            // Add it as an outstanding message
            this.messageQueue.set(JSON.parse(joinRPC).id, { rpc: joinRPC, settled: false, contactId: id })
            this.send(joinRPC, { address: contact.address, port: contact.port })

        } else {

            throw "The node id entered is not valid"

        }      
    }



    /**
     * Trigger the iterativeFind process by passing a key which represents either
     * a value stored on a node or a node id itself. The requesting node will first 
     * search its own routing table for the closest contacts to the key and then send
     * each of them the FIND_NODE rpc. 
     * @public
     * @param { string | buffer } key the node / value id to find
     */
    find_key(key) {
        // TODO get the node in our routing table closest to the key
        if(isKeyStringValid(key)) {
            this._iterativeFindNode(key, [...this.router.getClosestContactsByKeyValue(key, 20, true).entries()])
        } else {
            throw "The key is not valid"
        }
         

    }


    /**
     * Inform the network, via this nodes routing table, that it is leaving.
     */
    leave_network() {

    }



    /**
     * This node has received a ping request and will respond with a success message
     * @private
     * @param  { object } req the original message and contact
     */
    PING(req) {
        this.send(this.createResponse('success', req.message.payload.id, { nodeId: this.identity.toString('hex') }), req.contact)
    }



    /**
     * The first thing the find_node request does is attempt to add the requesting node
     * as a contact to the recipient nodes router. If the bucket that this contact should be placed into 
     * is full, then the requesting node will go into a `cached nodes` map which can be reviewed all at once
     * thus reducing constant network activity (this is a Kademlia paper recommendation). If the bucket
     * is not full then the requesting node is added. 
     * 
     * In either case, the requesting node will also receive back a group of k closest contacts from 
     * the recipient node. 
     * 
     * @private
     * @param { object } req the deserialised RPC message from the sender. 
     * @param { number } n the number of contacts to send back. Should be K
     */
    FIND_NODE(req, n = 20) {

        let id = req.message.payload.params.nodeId
        let contact = req.contact

        if (isKeyStringValid(id)) {
            
            const [bucketIndex, bucket, contactIndex, c] = this.router.addContactByNodeId(id, contact)
            console.log(`Added new node to ${bucketIndex} | Count ${this.router.get(bucketIndex).length}`);
            if (contactIndex === -1) {

                
                const [cbucketIndex, cbucket, ccontactIndex, cc] = this.cachedNodes.addContactByNodeId(id, contact)
                console.log("Adding new node to node cache: ", id, " Cache Bucket Index: ", cbucketIndex, " Router Bucket Index: ", bucketIndex);

            }

            this.send(this.createResponse("success", req.message.payload.id, { key: id, k: [...this.router.getClosestContactsByKeyValue(id, n, true).entries()] }), { address: contact.address, port: contact.port })

        } else {

            throw "The id provided is not valid"

        }
    }



    /**
     * If the key is in the routing table then the data is returned. If the key
     * is not found then the k closest node ids are returned. Notice the omission of 
     * the exclusive parameter from the getClosestContacts call.
     * @private
     * @param {string | buffer} key 
     * @param {number} n the number of nodes to return (K)
     */
    FIND_VALUE(req, n = 20) {

        let id = req.message.payload.params.nodeId
        let contact = req.contact

        if (isKeyStringValid(id)) {
            
            const [bucketIndex, bucket, contactIndex, c] = this.router.addContactByNodeId(id, contact)
            
            if (contactIndex === -1) {
                
                this.cachedNodes.addContactByNodeId(id, contact)

            }
            
            this.send(this.createResponse("success", req.message.payload.id, { key: id, k: [...this.router.getClosestContactsByKeyValue(id, n).entries()] }), { address: contact.address, port: contact.port })


        } else {

            throw "The id provided is not valid"

        }
    }
    
    

    /**
     * Store the information that has been received. The information should be compromised of
     * a key (id) and a value (address details / some data). 
     * @param {object} req the rpc with the data
     */
    STORE(req) {

        let id = req.message.payload.params.nodeId
        let contact = req.contact

        if (isKeyStringValid(id)) {
            
            const [bucketIndex, bucket, contactIndex, c] = this.router.addContactByNodeId(id, contact)
            
            if (contactIndex === -1) {

                this.cachedNodes.addContactByNodeId(id, contact)
                
            }
            
        } else {

            throw "The id provided is not valid"

        }
        

    }


    /**
     * Pick a random ID in a bucket that has not been refreshed in over an hour and
     * perform a search on that ID
     * TODO I think a republish also needs to be done here i.e. STORE rpc are sent out so the network persists
     */
    _refresh(bucket) {
        // TODO this is where we will do the pings. For any absent responses the worker will go to the cachedNodes and make a replacement

        // Pick a random ID in the bucket
        const rnd = Math.floor(Math.random() * Math.floor(bucket.size));
        const key = [...bucket.keys()][rnd]
        const k = [...this.router.getClosestContactsByKeyValue(key, 20).entries()]
        this._iterativeFindNode(key, k, true)
        this.router.get(this.router.indexOf(key)).lastRefresh = Date.now() // ! Is this causing an issue?

    }
    
    /**
     * By passing a list of k closest contacts to a certain key, this node will send a FIND_NODE messages to each
     * of those contact (alpha contacts each time i.e. 3) in order to get closer and closer to the key
     * being sought after. 
     * 
     * The responses received are checked for closeness to the key again and if they are closer than what has already 
     * been seen they will make it to the list.
     * 
     * Finally, the closest node without the key will be tracked throughout this process and will, at the end, be sent
     * a STORE rpc of the {key, value} thus `caching` it for a quick potential future search.
     * 
     * @private
     * @param {string} key the key value to search on
     * @param {array} contacts nodes returned from the FIND_NODE call or passed as a find_node param
     * @param {boolean} exclusive do we want to exclude the exact matching result (false if we want exact match)
     */
    // TODO Store the value on the closest node where it wasn't found - i think this is in order to put the value there after the run
    _iterativeFindNode(key, contacts, exclusive) {
        console.log("FINDING NODE: ", key);
        this.contacts.key = key

        // TODO do we not need to clear this.contacts from any previous runs?
        contacts.forEach(c => {

            this.contacts.set(c)
        })

        // If all contacts has been contacted even after adding the new ones, then the algorthim has finished i.e. it didn't find anything closer
        if (this.contacts.getContacted.length == this.contacts.size) {

            let final = [...this.contacts.entries()]
            final.forEach(node => {
                // Send ping
                // TODO send STORE to closest
                let pingRPC = this.createRequest("PING", { time: Date.now() })
                this.messageQueue.set(JSON.parse(pingRPC).id, { rpc: pingRPC, settled: false, contactId: node[0] }) // Settled is set to false to showing still pending
                this.send(pingRPC, { address: node[1].address, port: node[1].port })
                
            })
            return
        }

        let shortlist = this.contacts.shortList
        //console.log(shortlist);

        shortlist.forEach(node => {
            // Create the RPC
            const findRPC = exclusive ? this.createRequest("FIND_NODE", { nodeId: key, contact: node[1], time: Date.now() }) : this.createRequest("FIND_VALUE", { nodeId: key, contact: node[1], time: Date.now() })

            // Add it as an outstanding message
            this.messageQueue.set(JSON.parse(findRPC).id, { rpc: findRPC, settled: false, contactId: node[0] })
            this.send(findRPC, { address: node[1].address, port: node[1].port }) 

        })

    }


    /**
     * This message queue function runs on a schedule (hence the `worker`) and it loops over each message in the
     * queue, removing any messages that have been settled (they don't need to be there) and checking how long
     * anything unsettled has been there.
     * 
     * If unsettled messages have been there over some arbitrary amount of time (Kademlia paper suggests an hour) 
     * then it means a PING has failed and we have a dead node in our routing table. We need to swap that node 
     * out for one of the nodes in the matching bucket of the cached nodes map. 
     * @private
     */
    _runMessageQueueWorker() {
        console.log("Running message queue. Queue size ", this.messageQueue.size);
        for (let [key, value] of this.messageQueue.entries()) {
            
            let msg = JSON.parse(value.rpc);

            if (value.settled) {

                this.messageQueue.delete(key)

            } else {

                console.log("Unsettled item in queue. Over limit: ", ((Date.now() - msg.params.time) > 6000));
                
                if ((Date.now() - msg.params.time) > 6000) {

                    this.messageQueue.delete(key)
                    console.log(this.router.get(159))
                    console.log(`Key: ${value.contactId}`)

                    if (this.router.get(this.router.indexOf(value.contactId)).has(value.contactId)) {
                        //console.log("Deleting dormant node from bucket: ", this.router.indexOf(value.contactId));
                        this.router.get(this.router.indexOf(value.contactId)).delete(value.contactId)
                        //console.log("new size of bucket: ", this.router.get(this.router.indexOf(value.contactId)).size);
                        // If the size of this bucket is > 0 in cached nodes, we can remove it from cached and add it to router
                        let cachedNodeBucket = this.cachedNodes.get(this.cachedNodes.indexOf(value.contactId))
                        //console.log(cachedNodeBucket);
                        if (cachedNodeBucket.length > 0) {
                            let head = [...cachedNodeBucket.head]
                            console.log(head);
                            this.router.addContactByNodeId(head[0], head[1])
                            this.cachedNodes.get(this.cachedNodes.indexOf(value.contactId)).delete(head[0])
                        }
                    }
                    
                }  
            }

        }
    }


    /**
     * @private
     */
    _runBucketRefreshWorker() {
        console.log("Checking bucket refresh times")
        for (const [key, bucket] of this.router) {
            console.log(`check bucket index ${key} | size ${bucket.size} | Needs refresh? ${(Date.now() - bucket.lastRefresh > 60000)}`);
            // TODO randomise the wait time from between like 45 mins and an hour
            if ((Date.now() - bucket.lastRefresh > 60000)) {
                // TODO check if bucket is empty
                if (bucket.size > 0) {
                    this._refresh(bucket)
                }
                
            }
        }
        
    }
}

export default KademliaNode