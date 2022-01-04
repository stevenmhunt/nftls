const path = require('path');
const fs = require('fs-extra');
const pngStash = require('png-stash');

const STASH_OFFSET = 4096;
const STASH_MAXLENGTH = 4096;
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
            stash.write(message, STASH_OFFSET + 3, message.length);
            var b0 = message.length >> 16;
            var b1 = (message.length >> 8) & 0xff;
            var b2 = message.length & 0xff;
            stash.setByte(STASH_OFFSET + 0, b0);
            stash.setByte(STASH_OFFSET + 1, b1);
            stash.setByte(STASH_OFFSET + 2, b2);            
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
            var msgLenData = stash.read(STASH_OFFSET + 0, 3);
            var msgLen = msgLenData[0] * 65536 + msgLenData[1] * 256 + msgLenData[2];
            if (msgLen > STASH_MAXLENGTH) {
                return resolve(null);
            }
            return resolve(stash.read(STASH_OFFSET + 3, msgLen).toString('utf8'));
        });
    });
}

module.exports = {
    encodeImageData,
    decodeImageData
};
