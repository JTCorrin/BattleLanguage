import BaseNode from './base-node.js'


class KademliaNode extends BaseNode {
    constructor(PORT) {
        super(PORT)
        this.on('messageRecieved', (msg) => {
            console.log(msg);
        })

    }
}

export default KademliaNode