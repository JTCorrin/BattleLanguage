import KademliaNode from './lib/kademlia-node.js'


const n = new KademliaNode(7314)
// const message = Buffer.from('Some bytes');

let note = n.createNotification('ping', { "test": "hello" })
n.send(note, { address: "", port: "" })
// console.log(note);
