import Bucket from './bucket.js'
import { getBucketIndex, isKeyStringValid } from './utils.js'


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
        //console.log(`Adding ID: ${nodeId}`);
        if(isKeyStringValid(nodeId)) {
            const bucketIndex = this.indexOf(nodeId);
            const bucket = this.get(bucketIndex);
            const contactIndex = bucket.set(nodeId, contact);
            return [bucketIndex, bucket, contactIndex, contact];
        } else {
            throw "Invalid ID"
        }
        
    }



    /**
     * Removes the contact by the specified node id. This will be
     * performed upon request (the requesting node is leaving the network)
     * and on failed ping
     * 
     * @param { buffer | string } nodeId
     */
    removeContactByNodeId(nodeId) {
        if(isKeyStringValid(nodeId)) {
            const bucketIndex = this.indexOf(nodeId);
            return this.get(bucketIndex).delete(nodeId)
        } 

        return false
    }


    /**
     * Returns the contacts details for the node id provided
     * @param {buffer | string} nodeId 
     */
    getContactByNodeId(nodeId) {
        return this.get(this.indexOf(nodeId)).get(nodeId)
    }


    
    /**
     * Returns the n number of nodeIds that are close to the key passed. Ultimately,
     * this will be the nodes that reside in the same bucket, unless there a less than
     * n in which case the buckets before and after will be search for nodes.
     * 
     * When a new node joins the network it will request this contact list but the only contact
     * will be the bootstrap node.
     * 
     * @param { buffer | string}  key the key of the data that has been requested
     * @param { number } n the amount of contacts to return. Either K or Alpha
     * @param { boolean } exclusive exclude exact matches
     * @returns { Map } contactResults
     */
    getClosestContactsByKeyValue(key, n = 20, exclusive = false) {
        let bucketIndex = this.indexOf(key)
        const bucket = this.get(bucketIndex)
        const contactResults = new Map()

        function _addNearestFromBucket(bucket) {
            let entries = [...bucket.getClosestToKey(key, n, exclusive).entries()];
      
            entries.splice(0, n - contactResults.size)
            .forEach(([id, contact]) => {
                if (contactResults.size < n) {
                    contactResults.set(id, contact);
                }
            });
        }
      
        let ascIndex = bucketIndex;
        let descIndex = bucketIndex;
    
        _addNearestFromBucket(this.get(bucketIndex));
    
        // Get all contacts in buckets above and below the current bucket if the 
        // length of the contactresults is less that n
        while (contactResults.size < n && descIndex >= 0) {
            _addNearestFromBucket(this.get(descIndex--));
        }
    
        while (contactResults.size < n && ascIndex < 160) {
            _addNearestFromBucket(this.get(ascIndex++));
        }


        return contactResults
    }

    
}

export default RoutingTable