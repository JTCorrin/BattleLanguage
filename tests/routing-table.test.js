import RoutingTable from '../lib/routing-table.js'
const utils = require('../lib/utils')

const n = 60
const id = utils.getRandomKeyBuffer()
const RT = new RoutingTable(id)
const cachedNodes = new RoutingTable(id)


describe("@module routing-table", () => {

    describe("@function constructor", () => {
        it("creates a Map of length 160 (b)", () => {
            expect(RT.size).toBe(160)
        })

        it("creates empty buckets at each index", () => {
            const i = Math.floor(Math.random() * Math.floor(61))
            expect(RT.get(i)).toBeDefined()
        })

        it("maintains the id given to it", () => {
            expect(RT.identity).toBe(id)
        })
    })


    describe("@function `addContactByNodeId`", () => {
        
        let [bucketIndex, bucket, contactIndex, contact] = RT.addContactByNodeId(RT.identity.toString('hex'), {})
        const remoteNode = utils.getRandomKeyString()
        let [rBucketIndex, rBucket, rContactIndex, rContact] = RT.addContactByNodeId(remoteNode, { address: "0.0.0.0", port: "8080" })
        let [cBucketIndex, cBucket, cContactIndex, cContact] = cachedNodes.addContactByNodeId(remoteNode, { address: "0.0.0.0", port: "8080" })

        it("should place its own address in bucket 0", () => {
            expect(bucketIndex).toBe(0)
        })


        it("adds node addresses at positions greater than 0", () => {
            expect(rBucketIndex).toBeGreaterThan(0)
        })


        it("rejects an invalid id", () => {
            expect(() => RT.addContactByNodeId(9)).toThrow()
        })


        it("places an id in the same index for both cachedNodes and non-cached nodes", () => {
            expect(cBucketIndex).toBe(rBucketIndex)
        })


        it("rejects nodes when the bucket is full and places the rejected node into cachedNodes", () => {
            let bContactIndex = true
            let cachedNodesContactCount = cachedNodes.contactCount
            while (bContactIndex) {
                let id = utils.getRandomKeyString()
                let [rBucketIndex, rBucket, rContactIndex, rContact] = RT.addContactByNodeId(id, { address: "0.0.0.0", port: "8080" })
                if (rContactIndex == -1) {
                    // The bucket has rejected the new contact because it is full
                    bContactIndex = false
                    let [cBucketIndex, cBucket, cContactIndex, cContact] = cachedNodes.addContactByNodeId(id, { address: "0.0.0.0", port: "8080" })
                }
            }

            expect(cachedNodesContactCount).toBeLessThan(cachedNodes.contactCount)
            expect(cBucketIndex).toBe(rBucketIndex)

        })


    })



    describe("@function `getContactByNodeId`", () => {
        let id = utils.getRandomKeyString()
        RT.addContactByNodeId(id, { address: "0.0.0.0", port: "1234" })
        
        it("returns the node value via the nodeId", () => {
            let node = RT.getContactByNodeId(id)
            expect(node.port).toBe("1234")
        })
    })


    describe("@function `removeNodeByNodeId`", () => {

        it("returns true if the node has been removed", () => {
            expect(RT.removeContactByNodeId(id.toString('hex'))).toBe(true)
        })

        it("returns false is the node id does not exist", () => {
            expect(RT.removeContactByNodeId(utils.getRandomKeyBuffer())).toBe(false)
        })
    })


    describe("@function `getClosestContactByKeyValue", () => {
        // Add a bunch of dummy remote nodes
        const remoteNodes = [...new Array(n)].forEach((x, i) => {
            RT.addContactByNodeId(utils.getRandomKeyString(), { address: "0.0.0.0", port: i })
        })
        
        it("should return (k) contacts closest to this node", () => {
            let closeContacts = RT.getClosestContactsByKeyValue(utils.getRandomKeyString())
            expect(closeContacts.size).toBe(20)
        })
        
        
        it("should return (alpha) contacts closest to this node", () => {
            let closeContacts = RT.getClosestContactsByKeyValue(utils.getRandomKeyString(), 3)
            expect(closeContacts.size).toBe(3)
        })


        it("should return a map of n nodes either contains or disregards the search key dependant on whether exclusive is set to true or not", () => {
            let newNodeId = utils.getRandomKeyString()

            const RT2 = new RoutingTable(utils.getRandomKeyString()) // Create new RT as the other one might be full
            
            const remoteNodes = [...new Array(15)].forEach((x, i) => { // 15 ensures the buckets won't be full
                RT2.addContactByNodeId(utils.getRandomKeyString(), { address: "0.0.0.0", port: i })
            })

            RT2.addContactByNodeId(newNodeId, { address: "0.0.0.0", port: 9999 })
            
            let contact = RT2.getClosestContactsByKeyValue(newNodeId, 20)
            let contact2 = RT2.getClosestContactsByKeyValue(newNodeId, 20, true)
            expect(contact.has(newNodeId)).toBe(true)
            expect(contact2.has(newNodeId)).toBe(false)
        })

    })


    describe("@property `contactCount`", () => {
        expect(RT.contactCount).toBeLessThanOrEqual(n) // Less than because some of the n nodes might be rejected if a bucket is already at k
    })
    
})