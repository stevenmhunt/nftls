/* eslint-disable no-unused-expressions */
const assert = require('assert');
const path = require('path');
const { expect } = require('chai');
const fs = require('fs-extra');
const { encodeImageData, decodeImageData } = require('../src/img/steganography');
const { getTempFilePath, keccak256 } = require('../src/utils');

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

    it('should be able to encode null data to encoded images with same 512x512 base image and compare hashes', async () => {
        // arrange
        const tempFile1 = getTempFilePath();
        const tempFile2 = getTempFilePath();
        const data1 = 'abcdefgh'.repeat(128); // 1 KB of data.
        const data2 = '01234567'.repeat(128); // 1 KB of data.

        // act
        await encodeImageData(artImage, data1, tempFile1);
        await encodeImageData(tempFile1, null);
        await encodeImageData(artImage, data2, tempFile2);
        await encodeImageData(tempFile2, null);
        const hash1 = keccak256(await fs.readFile(tempFile1));
        const hash2 = keccak256(await fs.readFile(tempFile2));
        await Promise.all([fs.unlink(tempFile1), fs.unlink(tempFile2)]);

        // assert
        expect(hash1).to.equal(hash2);
    });

    it('should not be able to encode and then decode more than 65,000 bytes of data using a 512x512 png image', async () => {
        // arrange
        const tempFile = getTempFilePath();
        const data = '01234567'.repeat(128 * 64); // 65,535 bytes of data.

        // act
        try {
            await encodeImageData(artImage, data, tempFile);
            await fs.unlink(tempFile);
        } catch (err) {
            expect(err.message).to.equal('Message size cannot exceed 65000 bytes.');
            return;
        }

        // assert
        assert.fail('Expected an exception to be thrown.');
    });
});
