

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
     * @param nodeID the ID of the node we are creating a link to   
     * @param contact the nodes ip, port and any other information.
     */
    set(nodeID, contact) {
        if (this.has(nodeID)) {
            super.delete(nodeID)
            super.set(nodeID, contact) // As this is a map this will maintain order of insertion thus placing this node at the end
        } else {
            let bucketEntries = [...this.entries()];

            super.clear();
            super.set(nodeId, contact); //  Place the new contact at the head

            for (let [nodeId, contact] of bucketEntries) {
                super.set(nodeId, contact); // Put back all the other nodes after the new head
            }
        }

        // TODO is it necessary to return the index of the node?
    }

    get(key) {}


    
}

export default Bucket