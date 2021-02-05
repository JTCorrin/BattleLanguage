import BaseNode from './base-node.js'
import ContactList from './contact-list.js'
import { getBucketIndex, isKeyStringValid } from './utils.js'


class KademliaNode extends BaseNode {
    constructor(options) {
        super(options)
        
        // Message queue holds the unsettled messages this node has sent out and for which it is awaiting a reply.
        // The key for a message is the GUID of the message. The value is a callback to execute once the reply is received.
        this.messageQueue = new Map()
        this.contacts = new ContactList()


        // Message ready is omitted when a message has been received and deserialised - this is the req object
        this.on('messageReady', (req) => {
            switch (req.message.type) {
                case 'request':
                    this[req.message.payload.method](req)
                    break;
                case 'success':
                    // We have had a successful interaction with another node. Refresh its position in the routing table
                    //console.log("success message")
                    //console.log(req);
                    //console.log(req.payload.result);
                    // TODO Emit the different types and register listeners to handle those types
                    // TODO Ultimately this is messy
                    if (this.messageQueue.has(req.message.payload.id)) {
                        let msg = this.messageQueue.get(req.message.payload.id)
                        if (msg.settled == false) {
                            msg.settled = true
                            this.messageQueue.set(req.message.payload.id, msg) // Worker will come and remove settled messages
                            if (JSON.parse(msg.rpc).method == "FIND_NODE") {
                                this._iterativeFindNode(req.message.payload.result.key, req.message.payload.result.k)
                            } else if (JSON.parse(msg.rpc).method == "PING") {
                                //console.log("ping success");
                                this.router.addContactByNodeId(req.message.payload.result.nodeId, req.contact)
                                console.log(this.router);
                            }
                            // TODO needs to be settled
                                
                        }
                    }
                    
                    break;
            
                default:
                    // Simply drop the message
                    break;
            }
        })

    }

    /**
     * The node is requesting to join a network. First it will add the provided bootstrap node information to
     * its routing table. It will then perform a findNode iterative function to begin populating its own routing
     * table with neighbours 
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
     * This node has received a ping request and will respond with a success message
     * if it is available (online) to receive the message
     * @param  { object } req the original message and contact
     */
    PING(req) {
        console.log("received ping");
        this.send(this.createResponse('success', req.message.payload.id, { nodeId: this.identity.toString('hex') }), req.contact)
    }



    /**
     * The first thing the find_node request does is attempt to add the requesting node
     * as a contact to the recipients router. If the bucket that this contact should be placed into 
     * is full, then the oldest node in the bucket is pinged to see if it is still alive. If the bucket
     * is not full then the requesting node is added. 
     * 
     * In either case, the requesting node will also receive back a group of k closest contacts from 
     * the recipient node. 
     * 
     * Returns the k closest nodes to the given id.
     * @param { object } req the deserialised RPC message from the sender. 
     * TODO add alpha to the constants and use it here
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
            this.send(this.createResponse("success", req.message.payload.id, { key: id, k: [...this.router.getClosestContactsByKeyValue(id, 20, true).entries()] }), { address: contact.address, port: contact.port })


        } else {
            console.log("not valid");
        }
    }


    /**
     * If the key is in the routing table then the data is returned. If the key
     * is not found then the k closest node ids are returned
     * @param {string | buffer} key 
     */
    FIND_VALUE(req) {
        // Create an array of contacts to contact
        let shortList = this.router.getClosestContactsByKeyValue(req.message.payload.params.id) // TODO this might return the actual value we are looking for so....
    }
    
    
    /**
     * Data should be stored on K contacts that are nearest the given key. In order to#
     * find this a simple findNode call can be done on the key.
     * @param {object} data 
     */
    STORE(req) {

    }


    /**
     * Build a list of K closest nodes to a key by sending messages to the closest nodes
     * this node has. The responses received are checked for closeness to the key and if
     * they are closer than what has already been seen they will make it to the list.
     * @param {string} key the key value to search on
     * @param {array} contacts nodes returned from the FIND_NODE call
     */
    _iterativeFindNode(key, contacts) {
        this.contacts.key = key
        console.log("Received contacts: ");
        console.log(contacts);
        // TODO The node receiving these contacts is adding them to the contact list only at this point
        // TODO should they also be added to the router?
        contacts.forEach(c => {
            //console.log('Setting');
            this.contacts.set(c)
        })

        // If all contacts has been even after adding the new ones, then the algorthim has finished
        console.log(this.contacts);
        console.log(this.contacts.getContacted);
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
            const findRPC = this.createRequest("FIND_NODE", { nodeId: key, contact: node[1] })

            // Add it as an outstanding message
            this.messageQueue.set(JSON.parse(findRPC).id, { rpc: findRPC, settled: false, contactId: node[0] })
            this.send(findRPC, { address: node[1].address, port: node[1].port })  
        })

    }
}

export default KademliaNode