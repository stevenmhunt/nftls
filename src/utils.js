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
        return `${path.substring(0, 11)}...${path.substring(path.length - 5, path.length)}`.toLowerCase();
    }
    return path.toLowerCase();
}

module.exports = {
    SEPARATOR,
    generateCode,
    generateSerialNumber,
    shortenPath
};
