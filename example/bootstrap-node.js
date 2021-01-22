import KademliaNode from '../lib/kademlia-node.js'
//import level from 'level'

//const db = level("db/test_db")
const PORT = process.argv.slice(2)[0]

const n = new KademliaNode({
    PORT: PORT
})
// const message = Buffer.from('Some bytes');
console.log(`NODE IDENTITY ${ n.identity.toString('hex') }`);
let joinRequest = n.createRequest('join', { 'id': n.identity.toString('hex') })

n.send(joinRequest, { address: '0.0.0.0', port: '7816' })


