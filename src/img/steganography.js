const fs = require('fs-extra');
const pngStash = require('../../lib/pngStash');
const { keccak256 } = require('../utils');

const HASH_LENGTH = 64;
const STRLEN_LENGTH = 2;
const STASH_MAXLENGTH = 2 ** 16 - 1;
const MAX_MESSAGE_SIZE = 65000;
const NULL_CHAR = '\0';

/**
 * Writes the given message into the target image.
 * @param {string} filepath The target image.
 * @param {string} message The message to write into the color bits.
 * @param {string} output (optional) The output file path.
 * @returns {Promise<string>} The output file.
 */
async function encodeImageData(filepath, message, output = null) {
    const newfile = output || filepath;
    if (output) {
        await fs.copyFile(filepath, newfile);
    }

    return new Promise((resolve, reject) => {
        pngStash(newfile, (err, stash) => {
            if (err) return reject(err);
            try {
                const offset = stash.length < STASH_MAXLENGTH ? 0 : stash.length / 4;

                // if there is no message, encode using the default "blank" message.
                // this is how we encode the image's hash into itself without breaking anything.
                if (message === null) {
                    const boundary = stash.length - offset - STRLEN_LENGTH - HASH_LENGTH;
                    const size = boundary < MAX_MESSAGE_SIZE
                        ? boundary
                        : MAX_MESSAGE_SIZE;
                    // eslint-disable-next-line no-param-reassign
                    message = NULL_CHAR.repeat(size);
                }

                // write the byte length as well as a hash to prevent bad reads later.
                const buf = Buffer.from(message);
                if (buf.length > MAX_MESSAGE_SIZE) {
                    throw new Error(`Message size cannot exceed ${MAX_MESSAGE_SIZE} bytes.`);
                }
                stash.write(buf, offset + STRLEN_LENGTH + HASH_LENGTH, buf.length);
                stash.write(keccak256(buf).replace('0x', ''), offset + STRLEN_LENGTH, HASH_LENGTH);
                // eslint-disable-next-line no-bitwise
                const b0 = (message.length >> 8) & 0xff;
                // eslint-disable-next-line no-bitwise
                const b1 = message.length & 0xff;
                stash.setByte(offset + 0, b0);
                stash.setByte(offset + 1, b1);
                return stash.save((err2, data) => {
                    if (err2) return reject(err2);
                    if (data) { return resolve(data); }
                    return resolve(newfile);
                });
            } catch (internalErr) {
                return reject(internalErr);
            }
        });
    });
}

/**
 * Extracts a message from the target image.
 * @param {string} filepath TRhe target image.
 * @returns {Promise<string>} A message from the target image.
 */
async function decodeImageData(filepath) {
    return new Promise((resolve, reject) => {
        pngStash(filepath, (err, stash) => {
            if (err) return reject(err);
            try {
                const offset = stash.length < STASH_MAXLENGTH ? 0 : stash.length / 4;

                // check the size of the image to see if there is data.
                const msgLenData = stash.read(offset + 0, STRLEN_LENGTH);
                const msgLen = msgLenData[0] * 256 + msgLenData[1];
                if (msgLen > MAX_MESSAGE_SIZE) {
                    return resolve(null);
                }

                // check the buffer sizes and hash.
                const hash = stash.read(offset + STRLEN_LENGTH, HASH_LENGTH).toString('utf8');
                const result = stash.read(offset + STRLEN_LENGTH + HASH_LENGTH, msgLen);
                if (hash !== keccak256(result).replace('0x', '')) {
                    return resolve(null);
                }

                return resolve(result.toString('utf8'));
            } catch (internalErr) {
                return reject(internalErr);
            }
        });
    });
}

module.exports = {
    encodeImageData,
    decodeImageData,
};
