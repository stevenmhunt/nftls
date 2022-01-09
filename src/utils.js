const _ = require('lodash');
const crypto = require('crypto');

// using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
const SEPARATOR = "\r\n";

function generateCode() {
    return crypto.randomBytes(4).readUInt32BE();
}

function generateSerialNumber() {
    return crypto.randomBytes(16).toString('hex');    
}

function shortenPath(path) {
    if (path.length > 20) {
        const [addr, num] = path.split('#');
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4, addr.length)}${num ? '#' + num : ''}`.toLowerCase();
    }
    return path.toLowerCase();
}

module.exports = {
    SEPARATOR,
    generateCode,
    generateSerialNumber,
    shortenPath
};
