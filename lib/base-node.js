import EventEmitter from 'events';
// import utils from './utils'
// import constants from './constants'
import { updTransport } from './udp-transport.js'

class BaseNode extends EventEmitter {


    constructor () {
        super()
        this.transport = new updTransport()
        this.transport.listen()
    }

    sendMessage(msg, contact) {
        this.transport._write(msg, contact)
    }




}

export const node = BaseNode