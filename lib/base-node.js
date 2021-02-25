import EventEmitter from 'events';
// import utils from './utils'
// import constants from './constants'
import jrs from 'jsonrpc-serializer'
import { v4 as uuidv4 } from 'uuid';
import { updTransport } from './udp-transport.js'
import { getRandomKeyBuffer } from './utils.js'
import RoutingTable from './routing-table.js'



/**
 * The basenode ultimately houses
 * - the node identity
 * - the transport object (UDP)
 * - the routing table object
 * and all the RPC convenience methods i.e. 
 * - createRequest
 * - createResponse
 * - createNotification
 * 
 * As it holds the transport object, it also listens for when a message it received and
 * emits the deserialised message for listeners to consume
 */
class BaseNode extends EventEmitter {

    constructor (options) {
        super()
        this.identity = options.id || getRandomKeyBuffer() // TODO this should be a hash of a public key. Messages should be fully or partially signed
        this.address = { address: "0.0.0.0", port: options.PORT }
        this.transport = new updTransport(options.PORT) // an instantiated transport should be passed through in the options
        this.router = new RoutingTable(this.identity)
        this.cachedNodes = new RoutingTable(this.identity)
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


    /**
     * Sends the stringified RPC message to the contact via the transport
     * @param {object} rpcMsg the message to be sent
     * @param {object} contact the address and port of the recipient
     */
    send(rpcMsg, contact) {
        this.transport.write(rpcMsg, contact)
    }


    /**
     * Before sending a request the information must be formatted to RPC protocol. This convenience
     * method should be called to ensure the validity of the sent message
     * @param {string} method the method that will be called on the recipient node
     * @param {object} params additional information about the request, including the recipient address
     * @returns {string} stringified RPC object with GUID embedded 
     */
    createRequest(method, params) {
        return jrs.request(
            uuidv4(),
            method,
            params
        )
    }


    /**
     * A convenience method to create the response message to a request
     * @param {string} resType the type of response
     * @param {string | GUID } id the original requests id
     * @param {object | string} result the params or information to the returned to recipient
     * @returns {string} stringified RPC object with GUID embedded 
     */
    createResponse(resType, id, result) {
        if (resType == "success") {
            return jrs.success(
                id,
                result
            )
        } else {
            const errrpc = jrs.err.JsonRpcError(result) // TODO Formalise to the available error types
            console.log(errrpc);
            return jrs.error(
                id,
                errrpc // TODO - check these are valid - should be a type of jrs.err....
            )
        }
    }


    /**
     * Notifications send out messages that don't require a response and as such 
     * have no GUID embeddded within them. This will often be used to `ping` another 
     * node on the network. This convenience function will create the RPC object and return
     * a strigified version ready for transmission
     * @param {string} method the method that will be called on the recipient node
     * @param {object} params OPTIONAL - allows other data to be sent to the recipient
     * @returns {string} stringified RPC notification object
     */
    createNotification(method, params) {
        return jrs.notification(
            method,
            params
        )
    }

}

export default BaseNode