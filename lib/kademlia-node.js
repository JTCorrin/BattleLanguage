import BaseNode from './base-node.js'
import { getBucketIndex, isKeyStringValid } from './utils.js'


class KademliaNode extends BaseNode {
    constructor(options) {
        super(options)
        
        // Message queue holds the unsettled messages this node has sent out and for which it is awaiting a reply.
        // The key for a message is the GUID of the message. The value is a callback to execute once the reply is received.
        this.messageQueue = new Map()


        // Message ready is omitted when a message has been received and deserialised - this is the req object
        this.on('messageReady', (req) => {
            switch (req.message.type) {
                case 'request':
                    this[req.message.payload.method](req)
                    break;
                case 'success':
                    // We have had a successful interaction with another node. Refresh its position in the routing table
                    console.log(req.contact);
                    this.router.addContactByNodeId(req.message.payload.result.id, req.contact)
                    console.log(this.router);
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
            this.router.addContactByNodeId(id, contact)
            this.send(this.createRequest("FIND_NODE", { id: this.identity.toString('hex') }), { address: contact.address, port: contact.port })    
        } else {
            // Throw error
        }      
    }



    /**
     * This node has received a ping request and will respond with a success message
     * if it is available (online) to receive the message
     * @param  { object } req the original message and contact
     * @param  { object } result optional details to be sent back to the node
     */
    ping(req, result = {}) { // TODO do a private ping to actually send the message? We also need to verify the contact somewhere before here
        this.send(this.createResponse('success', req.message.payload.id, result), req.contact)
    }


    /**
     * Returns the k closest nodes to the given id.
     * @param { object } req the deserialised RPC message from the sender. 
     */
    FIND_NODE(req) {
        let id = req.message.payload.params.id
        if (isKeyStringValid(id)) {
            console.log(`Finding nodes close to ${id}`);
            let shortlist = this.router.getClosestContactsByKeyValue(id) // Should only find the bootstrapnode
            console.log(shortlist);
            let alphaContacts = Array.from(shortlist).slice(0, 3)
            let closest = shortlist[0]
            alphaContacts.forEach(contactData => {
                const contact = contactData[1]
                console.log(contact);
                //this.send(this.createRequest("FIND_NODE", { id: this.identity }), { address: contact.address, port: contact.port })
            })
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
}

export default KademliaNode