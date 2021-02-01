import Bucket from '../lib/bucket.js'

describe("@module `bucket`", () => {

    let b = new Bucket()
    


    describe("@function `set`", () => {
        const dummyNodes = [...new Array(30)].forEach((x, i) => {
            b.set(i, "contact")
        })
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
            expect(tail[0]).toBe(0)
        })
    })
    
    
    describe("@property `get Head`", () => {
        it("should return the key `19` as this would be the youngest node", () => {
            const head = b.head
            expect(head[0]).toBe(19)
        })
    })
})