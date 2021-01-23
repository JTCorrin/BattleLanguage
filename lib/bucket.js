

class Bucket extends Map {
    constructor() {
        super()
    }


    /**
     * Adds a node to the bucket. If the node is known already, it will bump that node to the
     * first index of the bucket. If the node was not known before, it will also be added to
     * the first index. This is because:
     * 
     * "It is known that nodes that have been connected for a long time in a network will probably remain connected for a long time in the future.
     * Because of this statistical distribution, Kademlia selects long connected nodes to remain stored in the k-buckets. 
     * This increases the number of known valid nodes at some time in the future and provides for a more stable network." - Wikipedia "Kademlia"
     * 
     * @param {string} nodeID the ID of the node we are creating a link to   
     * @param {object} contact the nodes ip, port and any other information.
     */
    set(nodeID, contact) {
        if (this.has(nodeID)) {
            super.delete(nodeID)
            super.set(nodeID, contact) // As this is a map this will maintain order of insertion thus placing this node at the end
        } else {
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
        let i = 0
        for (const b of this.entries()) {
            console.log(b);
            if (b[0] == nodeID) {
                break
            }
            i++
        }
        return i
    }

    get(key) {}


    
}

export default Bucket