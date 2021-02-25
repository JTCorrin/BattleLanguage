const BaseNode = require('../lib/base-node').default
const utils = require('../lib/utils')


const n = new BaseNode({
    storage: {},
    PORT: 7413
})
describe("@module base-node", () => {
    
    describe("@function constructor and initialisation", () => {

        it("has a valid identity", () => {
            expect(utils.isKeyStringValid(n.identity)).toBe(true)
        })


        it("has an assigned port number", () => {
            expect(n.transport.port).not.toBeUndefined()
        })


        // it("begins listening via its `init` function", () => {
        //     expect(n._init).toHaveBeenCalled()
        // })
    })



    describe("@function `createRequest`", () => {

        const rpc = n.createRequest("PING", {})
        it("returns a RPC formatted string", () => {

            expect(rpc).toContain("json")

        })
        
    })


    describe("@function `createRsponse`", () => {

        const success = n.createResponse("success", "123", {})
        const error = n.createResponse("error", "123", {
            code: -32603,
            message: "Error!",
            data: {}
        })

        it("returns a RPC formatted string", () => {

            expect(success).toContain("json")
            expect(error).toContain("json")

        })

    })


    
})