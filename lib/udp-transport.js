import dgram from 'dgram'
import { EventEmitter } from 'events'


class UDPTransport extends EventEmitter {

    constructor (PORT) {
        super()
        this.socket = dgram.createSocket('udp4') 
        this.port = PORT
    }


    _init() {
        this.socket.on('error', (error) => { console.log(error) }) // Ommitted callbacks w/error will emit this event
        this.socket.on('message', (msg, rinfo) => {
            this.emit('messageReceived', msg)
        })
    }


    listen() {
        this.socket.bind(this.port, () => {
            const address = this.socket.address();
            console.log(`udp socket bound ${address.address}:${address.port}`);
        })
    }



    write(buffer, contact) {
        this.socket.send(buffer, 0, buffer.length, contact.port, contact.address)
    }

}

export const updTransport = UDPTransport