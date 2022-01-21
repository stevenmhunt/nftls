/* eslint-disable no-unused-expressions */
const assert = require('assert');
const path = require('path');
const { expect } = require('chai');
const fs = require('fs-extra');
const { encodeImageData, decodeImageData } = require('../src/img/steganography');
const { getTempFilePath } = require('../src/utils');

const tinyImage = path.join(__dirname, './data/images/tiny.png');
const artImage = path.join(__dirname, './data/images/art.png');

describe('steganography', () => {
    it('should be able to encode and then decode 1 kilobyte of data using a 64x64 png image', async () => {
        // arrange
        const tempFile = getTempFilePath();
        const data = '01234567'.repeat(128); // 1 KB of data.

        // act
        await encodeImageData(tinyImage, data, tempFile);
        const result = await decodeImageData(tempFile);
        await fs.unlink(tempFile);

        // assert
        expect(result).to.equal(data);
    });

    it('should be able to encode and then decode 65,000 bytes of data using a 512x512 png image', async () => {
        // arrange
        const tempFile = getTempFilePath();
        const data = '01234567'.repeat(8125); // 65,000 bytes of data.

        // act
        await encodeImageData(artImage, data, tempFile);
        const result = await decodeImageData(tempFile);
        await fs.unlink(tempFile);

        // assert
        expect(result).to.equal(data);
    });

    it('should not be able to encode and then decode more than 65,000 bytes of data using a 512x512 png image', async () => {
        // arrange
        const tempFile = getTempFilePath();
        const data = '01234567'.repeat(128 * 64); // 65,535 bytes of data.

        // act
        try {
            await encodeImageData(artImage, data, tempFile);
        } catch (err) {
            expect(err.message).to.equal('Message size cannot exceed 65000 bytes.');
            return;
        }

        // assert
        assert.fail('Expected an exception to be thrown.');
    });
});
