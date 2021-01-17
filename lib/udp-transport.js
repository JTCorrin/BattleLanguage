import dgram from 'dgram'


class UDPTransport {

    constructor () {
        this.socket = dgram.createSocket('udp4') 
        this.socket.on('error', (error) => { console.log(error) }) // Ommitted callbacks w/error will emit this event
        this.socket.on('message', this.read)
    }


    listen() {
        this.socket.bind(7314, () => {
            const address = this.socket.address();
            console.log(`udp socket bound ${address.address}:${address.port}`);
        })
    }



    write(buffer, contact) {
        this.socket.send(buffer, 0, buffer.length, contact.port, contact.address)
    }


    
    read(msg) {
        // The socket has received a message so we push it onto the readable stream for consumers to consume
        let data = JSON.parse(msg)
        switch (data.method) {
            case "test":
                console.log('success');
                break;
        
            default:
                break;
        }
    }

}

export const updTransport = UDPTransport