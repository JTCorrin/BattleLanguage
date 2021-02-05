import KademliaNode from '../lib/kademlia-node.js'
//import level from 'level'

//const db = level("db/test_db")
const PORT = process.argv.slice(2)[0]
const BOOTSTRAP_PORT = process.argv.slice(2)[1]


// TODO Create 30 nodes and have them all join
let remoteNodes = []
for (let index = 0; index < 5; index++) {
    let np = parseInt(PORT) + index + 1 // +1 because 0 will give us a duplicate
    remoteNodes.push(new KademliaNode({ PORT: np }))
}

remoteNodes.forEach(node => {
    node.join(["9068e7e853fce6a05c04448ffd7115a2362a66f5", { address: "0.0.0.0", port: 7816 }])
})

// const n = new KademliaNode({
//     PORT: PORT
// })
// // const message = Buffer.from('Some bytes');

// console.log(`NODE IDENTITY ${ n.identity.toString('hex') }`);

// n.join(["9068e7e853fce6a05c04448ffd7115a2362a66f5", { address: "0.0.0.0", port: 7816 }])