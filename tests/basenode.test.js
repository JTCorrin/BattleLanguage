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
    })


    
})