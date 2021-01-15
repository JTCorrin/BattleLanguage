const utils = require('../lib/utils')


test('`getRandomKeyBuffer` returns a buffer', () => {
  	expect(Buffer.isBuffer(utils.getRandomKeyBuffer())).toBe(true)
});

test("`isKeyStringValid` is true", () => {
	expect(utils.isKeyStringValid(utils.getRandomKeyString())).toBe(true)
})

test("`isKeyStringValid` is false", () => {
	expect(utils.isKeyStringValid("0xAF03")).toBe(false)
})

test("the difference between different keys is > 0", () => {
	const id1 = utils.getRandomKeyString()
	const id2 = utils.getRandomKeyString()
	const buffer = utils.calculateDistance(id1, id2)
	expect(buffer.readInt32BE()).toBeGreaterThan(0)
})

test("the difference between the same key is 0", () => {
	const id1 = utils.getRandomKeyString()
	const buffer = utils.calculateDistance(id1, id1)
	expect(buffer.readInt32BE()).toBe(0)
})



test("when keys are sorted by distance index 0 > than index n", () => {
	const buffers = [...new Array(5)].map(() => utils.getRandomKeyBuffer())
	//buffers.forEach(el => console.log(el.readInt32BE()))

	const sortedBuffers = utils.sortByDistance(buffers)
	//sortedBuffers.forEach(el => console.log(el.readInt32BE()))
	expect(sortedBuffers[0].readInt32BE()).toBeGreaterThan(sortedBuffers[sortedBuffers.length - 1].readInt32BE())
})
