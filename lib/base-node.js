import EventEmitter from 'events';
// import utils from './utils'
// import constants from './constants'
import jrs from 'jsonrpc-serializer'
import { v4 as uuidv4 } from 'uuid';
import { updTransport } from './udp-transport.js'

class BaseNode extends EventEmitter {


    constructor (PORT) {
        super()
        this.transport = new updTransport(PORT) // an instantiated transport should be passed through in the options
        this._init()
    }


    /**
     * @private
     * Setup listeners and events
     */
    _init() {
        this._listen()
        this.transport.on('messageReceived', (msg, rinfo) => {
            this._deserialiseMessage(msg)
        })
    }


    /**
     * @private
     * When node is instantiated, set it to be listening as default
     */
    _listen() {
        this.transport.listen()
    }


    /**
     * @private
     * @param message string 
     */
    _deserialiseMessage(message) {
        const rpcMessage = jrs.deserialize(message)
        this.emit('messageReady', rpcMessage)
    }


    send(rpcMsg, contact) {
        this.transport.write(rpcMsg, contact)
    }

    createRequest(method, params) {
        return jrs.request(
            uuidv4(),
            method,
            params
        )
    }

    createResponse(resType, id, result) {
        if (resType == "success") {
            return jrs.success(
                id,
                result
            )
        } else {
            return jrs.error(
                id,
                results // TODO - check these are valid - should be a type of jrs.err....
            )
        }
    }

    createNotification(method, params) {
        return jrs.notification(
            method,
            params
        )
    }




}

export default BaseNode