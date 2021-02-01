import RoutingTable from '../lib/routing-table.js'
const utils = require('../lib/utils')

const n = 60
const id = utils.getRandomKeyBuffer()
const RT = new RoutingTable(id)


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
        
        RT.addContactByNodeId(RT.identity.toString('hex'), {})
        const remoteNode = utils.getRandomKeyString()
        RT.addContactByNodeId(remoteNode)

        it("should place its own address in bucket 0", () => {
            const i = RT.indexOf(RT.identity.toString('hex'))
            expect(i).toBe(0)
        })


        it("adds node addresses at positions greater than 0", () => {
            const i = RT.indexOf(remoteNode)
            expect(i).toBeGreaterThan(0)
        })


        it("rejects an invalid id", () => {
            expect(() => RT.addContactByNodeId(9)).toThrow()
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

    })


    describe("@property `contactCount`", () => {
        expect(RT.contactCount).toBeLessThanOrEqual(n) // Less than because some of the n nodes might be rejected if a bucket is already at k
    })
    
})