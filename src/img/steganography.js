const fs = require('fs-extra');
const pngStash = require('png-stash');
const { sha256 } = require('./utils');

SHA256_HEX_LENGTH = 64;
STRLEN_LENGTH = 2;

const STASH_MAXLENGTH = 2 ** 16 - 1;
const NULL_CHAR = '\0';

async function encodeImageData(filepath, message, output) {
    const newfile = output || filepath;
    if (output) {
        await fs.copyFile(filepath, newfile);
    }

    return new Promise((resolve, reject) => {
        pngStash(newfile, function(err, stash) {
            if (err) return reject(err);
            const offset = stash.length / 4;
            if (message === null) {
                const size = (stash.length - offset) < STASH_MAXLENGTH ? (stash.length - offset) : STASH_MAXLENGTH;
                message = NULL_CHAR.repeat(size);
            }
            const buf = Buffer.from(message);
            stash.write(buf, offset + STRLEN_LENGTH + SHA256_HEX_LENGTH, buf.length);
            stash.write(sha256(buf), offset + STRLEN_LENGTH, SHA256_HEX_LENGTH);
            var b0 = (message.length >> 8) & 0xff;
            var b1 = message.length & 0xff;
            stash.setByte(offset + 0, b0);
            stash.setByte(offset + 1, b1);
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
            const offset = stash.length / 4;
            var msgLenData = stash.read(offset + 0, STRLEN_LENGTH);
            var msgLen = msgLenData[0] * 256 + msgLenData[1];
            if (msgLen > STASH_MAXLENGTH) {
                return resolve(null);
            }
            const hash = stash.read(offset + STRLEN_LENGTH, SHA256_HEX_LENGTH).toString('utf8');
            const result = stash.read(offset + STRLEN_LENGTH + SHA256_HEX_LENGTH, msgLen);
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
