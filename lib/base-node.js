import EventEmitter from 'events';
// import utils from './utils'
// import constants from './constants'
import jrs from 'jsonrpc-serializer'
import { v4 as uuidv4 } from 'uuid';
import { updTransport } from './udp-transport.js'
import { getRandomKeyBuffer } from './utils.js'
import RoutingTable from './routing-table.js'

class BaseNode extends EventEmitter {


    constructor (options) {
        super()
        this.identity = getRandomKeyBuffer()
        this.transport = new updTransport(options.PORT) // an instantiated transport should be passed through in the options
        this.router = new RoutingTable(this.identity)
        this._init()
    }


    /**
     * @private
     * Setup listeners and events
     */
    _init() {
        this._listen()
        this.transport.on('messageReceived', (msg, rinfo) => {
            this._deserialiseMessage(msg, rinfo)
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
     * Called as soon as the transport receives a message
     * @private
     * @param message string 
     * @param rinfo object - remote address information
     */
    _deserialiseMessage(message, rinfo) {
        const rpcMessage = jrs.deserialize(message)
        // TODO - drop message if its an error
        this.emit('messageReady', { message: rpcMessage, contact: rinfo })
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