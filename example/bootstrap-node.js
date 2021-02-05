import KademliaNode from '../lib/kademlia-node.js'
//import level from 'level'

//const db = level("db/test_db")
const PORT = process.argv.slice(2)[0]

const n = new KademliaNode({
    id: "9068e7e853fce6a05c04448ffd7115a2362a66f5",
    PORT: PORT
})

console.log(`BOOTSTRAP NODE IDENTITY ${ n.identity.toString('hex') }`);
n.on("nodeAdded", (id) => {
    console.log(`Added ${ id }`);
})

