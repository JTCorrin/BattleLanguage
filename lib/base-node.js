import EventEmitter from 'events';
// import utils from './utils'
// import constants from './constants'
const jrs = require('jsonrpc-serializer')
import { v4 as uuidv4 } from 'uuid';
import { updTransport } from './udp-transport.js'

class BaseNode extends EventEmitter {


    constructor () {
        super()
        this.transport = new updTransport() // an instantiated transport should be passed through in the options
    }

    listen() {
        this.transport.listen()
    }

    deserialiseMessage(msg) {
        return jrs.deserialize(msg)
    }

    _send(rpcMsg, contact) {
        this.transport.write(rpcMsg, contact)
    }

    createRequest(method, params) {
        return jrs.request(
            uuidv4(),
            method,
            ...params
        )
    }

    createResponse(resType, id, result) {
        if (resType == "success") {
            return jrs.success(
                id,
                ...result
            )
        } else {
            return jrs.error(
                id,
                ...results // TODO - check these are valid - should be a type of jrs.err....
            )
        }
    }

    createNotification(method, params) {
        return jrs.notification(
            method,
            ...params
        )
    }




}

export const node = BaseNode