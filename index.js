import KademliaNode from './lib/kademlia-node.js'


const n = new KademliaNode()
n.listen()
const message = Buffer.from('Some bytes');

let note = n.createNotification('ping', { "test": "hello" })
console.log(note);
