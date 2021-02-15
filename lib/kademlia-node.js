import BaseNode from './base-node.js'
import ContactList from './contact-list.js'
import { getBucketIndex, isKeyStringValid, randomIntFromInterval } from './utils.js'
import * as cron from 'node-cron'


class KademliaNode extends BaseNode {
    constructor(options) {
        super(options)
        
        // Message queue holds the unsettled messages this node has sent out and for which it is awaiting a reply.
        // The key for a message is the GUID of the message. 
        // TODO If a message is unsettled the node that it was sent to should be remove
        this.messageQueue = new Map()
        this.contacts = new ContactList()
        this.scheduler = cron.schedule("* * * * *", () => { this._runMessageQueueWorker() }) // Every minute of everyday...


        this.on("FIND_NODE", (req) => this._iterativeFindNode(req.message.payload.result.key, req.message.payload.result.k))
        // TODO the find_value at some point should only be returning the one node's details (as it is exclusive) HOW DOES THIS EFFECT THE JOB - HOW DOES THE API USE THIS RETURNED VALUE?
        this.on("FIND_VALUE", (req) => this._iterativeFindNode(req.message.payload.result.key, req.message.payload.result.k))
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

        this.scheduler.start()

    }

    /**
     * The node is requesting to join a network. First it will add the provided bootstrap node information to
     * its routing table. It will then perform a findNode iterative function to begin populating its own routing
     * table with neighbours 
     * @public
     * @param {string | buffer} peer the id and address of the bootstrap node
     */
    join([id, contact]) {
        if (isKeyStringValid(id)) {
            // Add bootstrap node to router->bucket
            const [bucketIndex, bucket, contactIndex, c] = this.router.addContactByNodeId(id, contact)
            
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
     * 
     * @public
     * @param { string | buffer } id the id to find
     * @param { object } contact the address we are going to send this request to
     */
    find([id, contact]) {
        // TODO iskey string valid and make sure its toString('hex')
        const findRPC = this.createRequest("FIND_VALUE", { nodeId: key, contact: this.address }) // This is slightly different to join as we pass the key we want and our address for the return value
        // Add it as an outstanding message
        this.messageQueue.set(JSON.parse(joinRPC).id, { rpc: joinRPC, settled: false, contactId: id })
        this.send(findRPC, { address: contact.address, port: contact.port })  

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
     * is full, then the oldest node in the bucket is pinged to see if it is still alive. If the bucket
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
        //console.log(req);
        let id = req.message.payload.params.nodeId
        let contact = req.contact

        if (isKeyStringValid(id)) {
            
            const [bucketIndex, bucket, contactIndex, c] = this.router.addContactByNodeId(id, contact)
            
            if (contactIndex === -1) {
                
                const oldestContact = this.router.get(this.router.indexOf(id)).head
                let pingRPC = this.createRequest("PING", { time: Date.now() })
                this.messageQueue.set(JSON.parse(pingRPC).id, { rpc: pingRPC, settled: false, contactId: oldestContact[0] }) // Settled is set to false to showing still pending
                this.send(pingRPC, { address: oldestContact[1].address, port: oldestContact[1].port })
                
            }
            console.log(this.router);
            // Send back the closest nodes to the requestor node
            this.send(this.createResponse("success", req.message.payload.id, { key: id, k: [...this.router.getClosestContactsByKeyValue(id, n, true).entries()] }), { address: contact.address, port: contact.port })


        } else {
            throw "The id provided is not valid"
        }
    }



    /**
     * If the key is in the routing table then the data is returned. If the key
     * is not found then the k closest node ids are returned. Notice the omission of 
     * the exclusive parameter from the getClosestContacts call
     * @param {string | buffer} key 
     */
    FIND_VALUE(req, n = 20) {
        let id = req.message.payload.params.nodeId
        let contact = req.contact
        this.send(this.createResponse("success", req.message.payload.id, { key: id, k: [...this.router.getClosestContactsByKeyValue(id, n).entries()] }), { address: contact.address, port: contact.port })
    }
    
    

    /**
     * Store the information that has been received. The information should be compromised of
     * a key (id) and a value (address details). Typically in kademlia the sender might want to
     * send a block of data (like a file) but that doesn't make as much sense in Battle Language
     * because its simply a communication layer.
     * @param {object} data 
     */
    STORE(req) {
        // TODO Should I be updating the router with the senders info?

    }


    /**
     * Pick a random ID in a bucket that has not been refreshed in over an hour and
     * perform a search on that ID
     */
    REFRESH() {

    }
    
    /**
     * Build a list of K closest nodes to a key by sending messages to the closest nodes
     * this node has. The responses received are checked for closeness to the key and if
     * they are closer than what has already been seen they will make it to the list.
     * @private
     * @param {string} key the key value to search on
     * @param {array} contacts nodes returned from the FIND_NODE call
     */
    // TODO Store the value on the closest node where it wasn't found - i think this is in order to put the value there after the run
    _iterativeFindNode(key, contacts) {
        this.contacts.key = key

        contacts.forEach(c => {

            this.contacts.set(c)
        })

        // If all contacts has been even after adding the new ones, then the algorthim has finished
        if (this.contacts.getContacted.length == this.contacts.size) {

            let final = [...this.contacts.entries()]
            final.forEach(node => {
                // Send ping
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
            const findRPC = this.createRequest("FIND_NODE", { nodeId: key, contact: node[1], time: Date.now() })

            // Add it as an outstanding message
            this.messageQueue.set(JSON.parse(findRPC).id, { rpc: findRPC, settled: false, contactId: node[0] })
            this.send(findRPC, { address: node[1].address, port: node[1].port })  
        })

    }


    /**
     * 
     * @private
     */
    _runMessageQueueWorker() {
        console.log("Going through message queue")
        for (let [key, value] of this.messageQueue.entries()) {
            console.log(key + ' = ' + value)
            if (value.settled) {
                this.messageQueue.delete(key)
            } else {
                console.log(key + ' = ' + value)
                // Check the timestamp -> is it over the wait time? // TODO Set as a constant?
                if ((Date.now() - value.rpc.time) > 60000) {
                    this.messageQueue.delete(key)
                    this.router.get(this.router.indexOf(value.contactId)).delete(value.contactId)
                }  
            }

        }
    }


    /**
     * @private
     */
    _runBucketRefreshWorker() {
        console.log("Checking bucket refresh times")
        
    }
}

export default KademliaNode