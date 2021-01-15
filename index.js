import { node } from './lib/base-node.js'


const n = new node()
const message = Buffer.from('Some bytes');

n.sendMessage(message, { port: 7301, address: "localhost" })
