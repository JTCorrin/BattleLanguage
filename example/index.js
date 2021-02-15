import KademliaNode from '../lib/kademlia-node.js'
//import level from 'level'

//const db = level("db/test_db")
const PORT = process.argv.slice(2)[0]
const BOOTSTRAP_PORT = process.argv.slice(2)[1]
const BOOTSTRAP_NODEID = process.argv.slice(2)[2]

const n = new KademliaNode({
    PORT: PORT
})
// const message = Buffer.from('Some bytes');

console.log(`NODE IDENTITY ${ n.identity.toString('hex') }`);

n.join([BOOTSTRAP_NODEID,{ address: '0.0.0.0', port: BOOTSTRAP_PORT }])

// So what if we simply want to find a value...? We need the API to do so


