const crypto = require('crypto')



exports.getRandomKeyBuffer = () => crypto.randomBytes(20)



exports.getRandomKeyString = () => this.getRandomKeyBuffer().toString("hex")



exports.isKeyStringValid = (key) => {
    let buffer
    try {
        buffer = Buffer.from(key, "hex")
    } catch (error) {
        return false
    }

    return exports.isKeyBufferValid(buffer)
}



exports.isKeyBufferValid = (key) => {
    return Buffer.isBuffer(key) && key.length === 20
}



exports.calculateDistance = (id1, id2) => {
    id1 = exports.isKeyStringValid(id1) ? id1 : Buffer.from(id1, "hex")
    id2 = exports.isKeyStringValid(id2) ? id2 : Buffer.from(id2, "hex")
    const d = Buffer.alloc(20).map((b, index) => id1[index] ^ id2[index])
    return d
}



exports.sortByDistance = (bufArray) => {
    return bufArray.sort(Buffer.compare)
}



/**
 * Converts a buffer to a string representation of binary
 * @param {buffer} buffer - Byte array to convert to binary string
 * @returns {string}
 */
exports.toBinaryStringFromBuffer = (buffer) => {
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