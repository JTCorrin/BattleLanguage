import BaseNode from './base-node.js'


class KademliaNode extends BaseNode {
    constructor(options) {
        super(options)
        
        this.on('messageReady', (req) => {
            this[req.message.payload.method](req)
        })

    }


    join({ message, contact }) {
        if (message.payload.params.id == this.identity.toString('hex')) {
            console.log('i am the boostrap node');
        } else {
            console.log('i am not the bootstrap node')
        }
    }

    
    /**
     * This node has received a ping request and will respond with a success message
     * if it is available (online) to receive the message
     * @param  req object
     */
    ping(req) { // TODO do a private ping to actually send the message? We also need to verify the contact somewhere before here
        this.send(this.createResponse('success', req.message.payload.id, {}), req.contact)
    }


    /**
     * This node has received a request to store data under a certain key
     * @param  key string - should be the id of a node
     * @param  value string - should be the contact details of the node
     */
    // store(req) {
    //     console.log("storing");
    //     const { key, value } = req.message.payload.params
    //     this.storage.put(key, value, (err) => {
    //         if (err) {
    //             console.log(err);
    //         }

    //         this.storage.get(key)
    //         .then(data => console.log(data))
    //     })
    // }



    findNode(id) {

    }



    findValue(value) {}
}

export default KademliaNode