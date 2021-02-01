import crypto from 'crypto'

export const getRandomKeyBuffer = () => crypto.randomBytes(20)


export const getRandomKeyString = () => getRandomKeyBuffer().toString("hex")


export const isKeyStringValid = (key) => {
    let buffer
    try {
        buffer = Buffer.from(key, "hex")
    } catch (error) {
        return false
    }

    return isKeyBufferValid(buffer)
}


export const isKeyBufferValid = (key) => {
    return Buffer.isBuffer(key) && key.length === 20
}


export const isHexaString = (str) => {
    return Buffer.from(str, 'hex').length == str.length / 2 
}


/**
 * This function will first of all calculate the distance between two node addresses.
 * How far that distance is determines which bucket of the routing table the 
 * foreign node will be placed in.
 * 
 * We start from the furthest bucket, 160, and looping through each byte in the distance we
 * check each bit for a postive value. This is done by comparing the distance byte against a
 * 128 value byte and shifting the bit in the comparison byte by one each loop i.e.
 * 
 * Distance byte (71) | Comparison byte (128 initially)
 * 0100 0111            1000 0000
 * 
 * As the comparison is done with the logical AND bitwise operator, on the first loop, we will
 * get a false as the first bits do not match. We decrement the bucketIndex as the distance must be closer.
 * We move the bit of the comparitor byte 1 place to the right and on this loop we get a match, we decrement 1
 * more from the bucket index and this is our bucketIndex.
 * 
 * If the bytevalue of the distance is zero (0000 0000) we can skip this byte and decrement the bucket index by 8
 * as there will not be a match. 
 * 
 * @param localNodeID hex string ID of this node
 * @param foreignNodeID hex string ID of node we want to find idex for.
 */
export const getBucketIndex = (localNodeID, foreignNodeID) => {
    let distance = calculateDistance(localNodeID, foreignNodeID)
    let bucketIndex = 160

    for (let byteValue of distance) {
        if (byteValue === 0) {
            bucketIndex -= 8; // Remove a byte...
            continue;
        }
    
        for (let i = 0; i < 8; i++) {
            if (byteValue & (0x80 >> i)) { // Bitwise operators - the & operator returns 1 is the bits match and 0 if they are different
                return --bucketIndex; // Note the return here
            } else {
                bucketIndex--;
            }
        }
    }
    
    return bucketIndex;
}


/**
 * Takes the ids of two nodes and calculates the distance via the 
 * XOR function.
 * @param {buffer | string} id1 
 * @param {buffer | string} id2 
 */
export const calculateDistance = (id1, id2) => {
    id1 = !Buffer.isBuffer(id1) ? Buffer.from(id1, 'hex') : id1;
    id2 = !Buffer.isBuffer(id2) ? Buffer.from(id2, 'hex') : id2;
    const d = Buffer.alloc(20).map((b, index) => id1[index] ^ id2[index])
    return d
}



export const sortByDistance = (bufArray) => {
    return bufArray.sort(Buffer.compare)
}



/**
 * Converts a buffer to a string representation of binary
 * @param {buffer} buffer - Byte array to convert to binary string
 * @returns {string}
 */
export const toBinaryStringFromBuffer = (buffer) => {
    const mapping = {
      '0': '0000',
      '1': '0001',
      '2': '0010',
      '3': '0011',
      '4': '0100',
      '5': '0101',
      '6': '0110',
      '7': '0111',
      '8': '1000',
      '9': '1001',
      'a': '1010',
      'b': '1011',
      'c': '1100',
      'd': '1101',
      'e': '1110',
      'f': '1111'
    };
    const hexaString = buffer.toString('hex').toLowerCase();
    const bitmaps = [];
  
    for (let i = 0; i < hexaString.length; i++) {
      bitmaps.push(mapping[hexaString[i]]);
    }
  
    return bitmaps.join('');
  };