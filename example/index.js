import KademliaNode from '../lib/kademlia-node.js'
//import level from 'level'

//const db = level("db/test_db")
const PORT = process.argv.slice(2)[0]

const n = new KademliaNode({
    PORT: PORT
})
// const message = Buffer.from('Some bytes');

let note = n.createNotification('ping', { "test": "hello" })
n.send(note, { address: "0.0.0.0", port: "7816" })
console.log(note);
