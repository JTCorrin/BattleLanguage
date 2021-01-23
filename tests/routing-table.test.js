import RoutingTable from '../lib/routing-table.js'
const utils = require('../lib/utils')

const RT = new RoutingTable(utils.getRandomKeyBuffer())

describe("@module routing-table", () => {

    describe("@function constructor", () => {
        it("creates a Map of length 160", () => {
            expect(RT.size).toBe(160)
        })

        it("creates empty buckets at each index", () => {
            const i = Math.floor(Math.random() * Math.floor(61))
            expect(RT.get(i)).toBeDefined()
        })
    })


    describe("@function `addContactByNodeId`", () => {
        RT.addContactByNodeId(RT.identity, {})
        const remoteNode = utils.getRandomKeyBuffer()
        RT.addContactByNodeId(remoteNode)
        it("automatically places its own address in bucket 0", () => {
            const i = RT.indexOf(RT.identity)
            expect(i).toBe(0)
        })


        it("adds node addresses at positions greater than 0", () => {
            const i = RT.indexOf(remoteNode)
            expect(i).toBeGreaterThan(0)
        })
    })
    
})