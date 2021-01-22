const utils = require('../lib/utils')

describe("@module utils", () => {

	
	describe("@function `getRandomKeyBuffer`", () => {

		it("returns a buffer", () => {
			expect(Buffer.isBuffer(utils.getRandomKeyBuffer())).toBe(true)
		})

	})
	
	
	describe("@function `getRandomKeyString`", () => {

		it("returns a hexadecimal string", () => {
			const str = utils.getRandomKeyString()
			expect(utils.isHexaString(str)).toBe(true)
		})

	})
	
	
	describe("@function `isKeyStringValid`", () => {

		it("returns true for a valid `Key String`", () => {
			expect(utils.isKeyStringValid(utils.getRandomKeyString())).toBe(true)
		})


		it("returns false for an invalid `Key String`", () => {
			expect(utils.isKeyStringValid("0xAF03")).toBe(false)
		})

	})


	describe("@function `getBucketIndex`", () => {

		it("returns an idex with the bit space", () => {
			const id1 = utils.getRandomKeyString()
			const id2 = utils.getRandomKeyString()
			const index = utils.getBucketIndex(id1, id2)
			expect(index).toBeGreaterThan(0)
			expect(index).toBeLessThanOrEqual(160)
		})
	})


	describe("@function `calculateDistance`", () => {

		it("confirms the distance between different keys is > 0", () => {
			const id1 = '20b084c6c232765be76cc4faaf2da68c27390fe0'
			const id2 = '5011a9eb079679485694ffca8db921594f614538'
			const buffer = utils.calculateDistance(id1, id2)
			const result = '70a12d2dc5a40f13b1f83b30229487d568584ad8'
			expect(buffer.toString('hex')).toBe(result)
		})


		it("confirms the difference between the same key is 0", () => {
			const id1 = utils.getRandomKeyString()
			const buffer = utils.calculateDistance(id1, id1)
			expect(buffer.readInt32BE()).toBe(0)
		})

	})


	describe("@function `sortByDistance`", () => {

		it("sorts and array of keys so that index 0 is greatest", () => {
			const buffers = [...new Array(5)].map(() => utils.getRandomKeyBuffer())
			const sortedBuffers = utils.sortByDistance(buffers)
			expect(sortedBuffers[0].readInt32BE()).toBeGreaterThan(sortedBuffers[sortedBuffers.length - 1].readInt32BE()) // Not sure if you need to get the int - can you just compare buffers?
		})

	})



})
