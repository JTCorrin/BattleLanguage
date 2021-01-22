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
        for (const b of [...new Array(60)]) {
            this.set(b, new Bucket())
        }
    }

    
    /**
     * Returns the bucket index of the given node id
     * @param {string|buffer} nodeId - Node identity to get index for
     * @returns {number}
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
     * @param {string|buffer} nodeId - Node identity to add
     * @param {object} contact - contact information for peer
     * @returns {array}
     */
    addContactByNodeId(nodeId, contact) {
        nodeId = nodeId.toString('hex');

        const bucketIndex = this.indexOf(nodeId);
        const bucket = this.get(bucketIndex);
        const contactIndex = bucket.set(nodeId, contact);

        this.events.emit('add', nodeId);
        return [bucketIndex, bucket, contactIndex, contact];
    }

    
}

export default RoutingTable