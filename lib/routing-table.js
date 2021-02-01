import Bucket from './bucket.js'
import { getBucketIndex } from './utils.js'

/**
 * The routing table contains a list of `buckets` which each contains
 * a set of information about other nodes on the network.
 * 
 * List length should be the same of the bit size of the address space (160)
 * @param identity string
 */
class RoutingTable extends Map {
    constructor (identity) {
        super()
        this.identity = identity
        // for (let b of [...new Array(60)]) {
        //     this.set(b, new Bucket())
        //     console.log(this);
        // }

        for (let b = 0; b < 160; b++) {
            this.set(b, new Bucket())          
        }
        
    }

    /**
     * Loop through each bucket in the table and sum up
     * the number of contacts in each bucket.
     * 
     * @property
     * @returns { int } total number of contacts in the table
     */
    get contactCount() {
        let contacts = 0
        this.forEach(b => {
            contacts += b.length
        })
        return contacts
    }

    
    /**
     * Returns the bucket index of the given node id
     * @param { string|buffer } nodeId - Node identity to get index for
     * @returns { number }
     */
    indexOf(nodeId) {
        return getBucketIndex(this.identity, nodeId);
    }


    /**
     * Adds the contact to the routing table in the proper bucket position,
     * returning the [bucketIndex, bucket, contactIndex, contact]; if the
     * returned contactIndex is -1, it indicates the bucket is full and the
     * contact was not added; kademlia implementations should PING the contact
     * at bucket.head to determine if it should be dropped before calling this
     * method again
     * @param { string|buffer } nodeId - Node identity to add
     * @param { object } contact - contact information for peer
     * @returns {array}
     */
    addContactByNodeId(nodeId, contact) {
        nodeId = nodeId.toString('hex');
        const bucketIndex = this.indexOf(nodeId);
        const bucket = this.get(bucketIndex);
        const contactIndex = bucket.set(nodeId, contact);

        //this.events.emit('add', nodeId);
        return [bucketIndex, bucket, contactIndex, contact];
    }



    /**
     * Removes the contact by the specified node id. This will be
     * performed upon request (the requesting node is leaving the network)
     * and on failed ping
     * 
     * @param { buffer | string } nodeId
     */
    removeContactByNodeId(nodeId) {
        nodeId = nodeId.toString('hex');
        const bucketIndex = this.indexOf(nodeId);
        return this.get(bucketIndex).delete(nodeId)
    }


    /**
     * Returns the contacts details for the node id provided
     * @param {buffer | string} nodeId 
     */
    getContactByNodeId(nodeId) {
        return this.get(this.indexOf(nodeId)).get(nodeId)
    }


    /**
     * This is first called by a node joining the network. That node will pass its
     * own id in order to get K number of "close" neighbours. Ultimately this will
     * be those contacts who reside in the same bucket as the requesting node, unless
     * the bootstrapping node does not have k contacts in that bucket, then it will iterate
     * through all its buckets until it has k contacts to return
     * 
     * @param { buffer | string } nodeId the id of the node to be looked up against
     */
    getClosestContactsByNodeId(nodeId) {
        let bucketIndex = this.indexOf(nodeId)
        const bucket = this.get(bucketIndex)
        return bucket.sortByDistanceToKey(nodeId)
    }
    
    /**
     * 
     * @param {buffer | string} keyValue the key of the data that has been requested
     */
    getClosestContactsByKeyValue(keyValue) {
        let bucketIndex = this.indexOf(keyValue)
        const bucket = this.get(bucketIndex)
        if (bucket.has(keyValue)) {
            return bucket.get(keyValue)
        }

        return bucket.sortByDistanceToKey(keyValue)
    }

    
}

export default RoutingTable