import KademliaNode from '../lib/kademlia-node.js'
//import level from 'level'

//const db = level("db/test_db")
const PORT = process.argv.slice(2)[0]

const n = new KademliaNode({
    PORT: PORT
})
// const message = Buffer.from('Some bytes');

let joinRequest = n.createRequest('join', {})

