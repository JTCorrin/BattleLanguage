import { node } from './lib/base-node.js'


const n = new node()
n.listen()
const message = Buffer.from('Some bytes');

n.sendMessage(message, { port: 8089, address: "192.168.0.14" })
