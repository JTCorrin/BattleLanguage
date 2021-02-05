import Bucket from '../lib/bucket.js'
const utils = require('../lib/utils')

describe("@module `bucket`", () => {

    let b = new Bucket()
    let dummyNodes = []

    for (let index = 0; index < 30; index++) {
        dummyNodes.push([utils.getRandomKeyString(), { address: "0.0.0.0", port: index }])  
    }

    dummyNodes.forEach(x => {
        b.set(x)
    })

    describe("@function `set`", () => {
        
        it("bucket should not be empty", () => {
            expect(b.length).toBeGreaterThan(0)
        })

    })
    

    describe("@property `get limit`", () => {

        it("should be of `limit` length", () => {
            expect(b.limit).toBe(20)
        })

    })
    
    
    describe("@property `get Length`", () => {

        it("should be of `k` length", () => {
            expect(b.length).toBe(20)
        })

    })

    
    describe("@property `get Tail`", () => {

        it("should return the key `0` as this would be the oldest node", () => {
            const tail = b.tail
            expect(tail[0]).toBe(dummyNodes[0])
        })

    })
    
    
    describe("@property `get Head`", () => {

        it("should return the key `19` as this would be the youngest node", () => {
            const head = b.head
            expect(head[0]).toBe(dummyNodes[19])
        })

    })


    describe("@function `getClosestToKey`", () => {

        const remoteNode = utils.getRandomKeyString()
        const neighbours = b.getClosestToKey(remoteNode)
        const alpha = b.getClosestToKey(remoteNode, 3)

        it("should return a sorted Map of k or alpha addresses", () => {
            expect(neighbours.size).toBe(20)
            expect(alpha.size).toBe(3)
            expect(alpha[0]).toBe(neighbours[0])
            expect(alpha[2]).toBe(neighbours[2])
        })

    })
})