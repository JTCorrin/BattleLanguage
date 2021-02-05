
import { calculateDistance } from './utils.js'
class ContactList extends Map {
    constructor () {
        super()
        this.key = ""
    }


    /**
     * @property {number} length - The number of contacts in the bucket
     */
    get length() {
        return super.size;
    }

    
    /**
     * @property {number} limit - The max amount of items to be placed in the list
     */
    get limit() {
        return 20
    }


    get closest () {
        return this._contacts[0]
    }


    get getContacted () {
        return [...this.entries()].filter(node => node[1].contacted == true)
    }



    get shortList () {
        let s = [...this.getClosestToKey(this.key, 3, true)]
        //console.log(s);
        s.forEach(i => {
            //console.log(i);
            i[1].contacted = true
            
            super.set(i[0], i[1])
        })
        return s
    }



    set([nodeID, contact]) {
        if (!this.has(nodeID)) {
            // Add the item
            contact.contacted = false
            super.set(nodeID, contact)

            // If we have now gone over the limit of this list, remove the furthest away node
            if (this.size >= this.limit) {
                //console.log(`setting ${ nodeID }`);
                let k = [...this.getClosestToKey(this.key)].pop()
                super.delete(k[0])
            }
            
        } 
    }



    getClosestToKey(key, count = 20, exclusive = false) {
        let contacts = [];
        //console.log(this.entries())
        for (let [identity, contact] of this.entries()) {
            //console.log(contact);
            if (!contact.contacted) {
                contacts.push({
                    contact, identity, distance: calculateDistance(identity, key)
                });
            }
        }


        
        return new Map(contacts.sort((a, b) => {
            return calculateDistance(
                Buffer.from(a.distance, 'hex'),
                Buffer.from(b.distance, 'hex')
            );
        }).filter((result) => {
            if (exclusive) {
                return result.identity !== key.toString('hex');
            } else {
                return true;
            }
        }).map((obj) => [obj.identity, obj.contact]).splice(0, count));
    }


    
}

export default ContactList