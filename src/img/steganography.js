const fs = require('fs-extra');
const pngStash = require('png-stash');
const { sha256 } = require('./utils');

SHA256_HEX_LENGTH = 64;
STRLEN_LENGTH = 2;

const STASH_OFFSET = 2 ** 14;
const STASH_MAXLENGTH = 2 ** 16 - 1;
const NULL_CHAR = '0';

async function encodeImageData(filepath, message, output) {
    const newfile = output || filepath;
    if (output) {
        await fs.copyFile(filepath, newfile);
    }
    if (message === null) {
        message = NULL_CHAR.repeat(STASH_MAXLENGTH);
    }

    return new Promise((resolve, reject) => {
        pngStash(newfile, function(err, stash) {
            if (err) return reject(err);
            const buf = Buffer.from(message);
            stash.write(buf, STASH_OFFSET + STRLEN_LENGTH + SHA256_HEX_LENGTH, buf.length);
            stash.write(sha256(buf), STASH_OFFSET + STRLEN_LENGTH, SHA256_HEX_LENGTH);
            var b0 = (message.length >> 8) & 0xff;
            var b1 = message.length & 0xff;
            stash.setByte(STASH_OFFSET + 0, b0);
            stash.setByte(STASH_OFFSET + 1, b1);
            stash.save((err) => {
                if (err) return reject(err);
                return resolve(newfile);
            });
        });
    });
}

async function decodeImageData(filepath) {
    return new Promise((resolve, reject) => {
        pngStash(filepath, function(err, stash) {
            if (err) return reject(err);
            var msgLenData = stash.read(STASH_OFFSET + 0, STRLEN_LENGTH);
            var msgLen = msgLenData[0] * 256 + msgLenData[1];
            if (msgLen > STASH_MAXLENGTH) {
                return resolve(null);
            }
            const hash = stash.read(STASH_OFFSET + STRLEN_LENGTH, SHA256_HEX_LENGTH).toString('utf8');
            const result = stash.read(STASH_OFFSET + STRLEN_LENGTH + SHA256_HEX_LENGTH, msgLen);
            if (hash !== sha256(result)) {
                return resolve(null);
            }
            return resolve(result.toString('utf8'));
        });
    });
}

module.exports = {
    encodeImageData,
    decodeImageData
};
