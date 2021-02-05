import { calculateDistance } from './utils.js'
//import EventEmitter from 'events';




/**
 * The kademlia node organises its contacts, other nodes known to it, in `buckets`
 * which hold a maximum of k contacts. These are known as k-buckets.
 * 
 * The buckets are organized by the distance between the node and the contacts in the bucket.
 * 
 * A contact should hold at least:
 * 1. IP address
 * 2. Port Number
 * 3. NodeID
 * 
 * Within buckets contacts are sorted by the time of the most recent communication, 
 * with those which have most recently communicated at the end of the list and those which have least 
 * recently communicated at the front, regardless of whether the node or the contact initiated 
 * the sequence of messages.
 * - http://xlattice.sourceforge.net/components/protocol/kademlia/specs.html
 */
class Bucket extends Map {
    constructor() {
        super()
        //this.events = new EventEmitter()
    }


    /**
     * @property {number} length - The number of contacts in the bucket
     */
    get length() {
        return super.size;
    }

    /**
     * @property {object} head - The contact at the bucket head i.e. the oldest node in the bucket
     */
    get head() {
        return [...super.entries()].shift();
    }

    /**
     * @property {object} tail - The contact at the bucket tail i.e. the newest node to have been added to the bucket
     */
    get tail() {
        return [...super.entries()].pop();
    }
    
    /**
     * @property {number} limit - The max amount of items to be placed in the bucket (K)
     */
    get limit() {
        return 20
    }

    /**
     * Adds a node to the bucket. If the node is known already, it will bump that node to the
     * tail of the bucket. If the node was not known before, it will also be added to
     * the tail. This is because:
     * 
     * "It is known that nodes that have been connected for a long time in a network will probably remain connected for a long time in the future.
     * Because of this statistical distribution, Kademlia selects long connected nodes to remain stored in the k-buckets. 
     * This increases the number of known valid nodes at some time in the future and provides for a more stable network." - Wikipedia "Kademlia"
     * 
     * "k-buckets effectively implement a least recently seen eviction policy, except that live nodes are never removed from the bucket...
     * A second benefit of k-buckets is that they provide resistance to certain DoS attacks. One cannot flush nodes' routing state by flooding
     * the system with new nodes. Kademlia nodes will only insert the new nodes in the k-buckets when old nodes leave the system" - from the 
     * Kademlia paper
     * 
     * @param {string} nodeID the ID of the node we are creating a link to   
     * @param {object} contact the nodes ip, port and any other information.
     */
    set(nodeID, contact) {
        if (this.has(nodeID)) {
            super.delete(nodeID)
            super.set(nodeID, contact) // As this is a map this will maintain order of insertion thus placing this node at the end
        } else if(this.length < this.limit)  {
                //console.log(`Bucket size ${this.length} / ${this.limit}`);
                let bucketEntries = [...this.entries()];

                super.clear();
                super.set(nodeID, contact); //  Place the new contact at the head

                for (let [nodeID, contact] of bucketEntries) {
                    super.set(nodeID, contact); // Put back all the other nodes after the new head
                }
        } 
        return this.indexOf(nodeID)
    }


    indexOf(nodeID) {
        let isMissing = -1
        let i = 0
        for (const b of this.keys()) {
            if (b == nodeID) {
                return i
            }
            i++
        }
        return isMissing
    }


    /**
     * For every contact in this bucket, calculate the distance between it and the 
     * value that has been requested. Using that distance, we can sort the contacts
     * by distance and return
     * 
     * @param {string|buffer} key - Reference key for finding other contacts
     * @param {number} [count=constants.K] - Max results to return
     * @param {boolean} [exclusive=false] - Exclude result matching the key exactly
     * @returns {array}
     */
    getClosestToKey(key, count = 20, exclusive = false) {
        let contacts = [];

        for (let [identity, contact] of this.entries()) {
            contacts.push({
                contact, identity, distance: calculateDistance(identity, key)
            });
        }

        return new Map(contacts.sort((a, b) => {
            return calculateDistance(
                Buffer.from(a.distance, 'hex'),
                Buffer.from(b.distance, 'hex')
            );
        }).filter((result) => {
            if (exclusive) {
                return result.identity !== key.toString('hex');
            } else {
                return true;
            }
        }).map((obj) => [obj.identity, obj.contact]).splice(0, count));
    }

    
}

export default Bucket