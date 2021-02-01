import KademliaNode from '../lib/kademlia-node.js'
//import level from 'level'

//const db = level("db/test_db")
const PORT = process.argv.slice(2)[0]

const n = new KademliaNode({
    PORT: PORT
})

console.log(`BOOTSTRAP NODE IDENTITY ${ n.identity.toString('hex') }`);

// // Creates a request to join the network, passing its own identity as the params
// let joinRequest = n.createRequest('join', { 'id': n.identity.toString('hex') })

//  // Sends the request to the bootstrap node - so in this case, it will be requesting to bootstrap from itself
// n.send(joinRequest, { address: '0.0.0.0', port: '7816' })


