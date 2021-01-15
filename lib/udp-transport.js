import { Duplex } from 'stream'
import dgram from 'dgram'


class UDPTransport extends Duplex {


    constructor () {
        super()
        this.socket = dgram.createSocket('udp4') 
        this.socket.on('error', (error) => { console.log(error) }) // Ommitted callbacks w/error will emit this event
    }



    listen() {
        this.socket.bind(7301, () => {
            const address = this.socket.address();
            console.log(`udp socket bound ${address.address}:${address.port}`);
        })
    }



    _write(buffer, contact) {
        console.log("write");
        this.socket.send(buffer, 0, buffer.length, contact.port, contact.address, (err) => {
            console.log(err);
        })
    }


    
    _read() {
        // The socket has received a message so we push it onto the readable stream
        console.log("received");
        this.socket.once('message', (buffer) => {
            this.push(buffer);
        });
    }

}

export const updTransport = UDPTransport