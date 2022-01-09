const _ = require('lodash');
const crypto = require('crypto');

// using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
const SEPARATOR = "\r\n";

function generateCode() {
    return crypto.randomBytes(4).readUInt32BE();
}

function generateIdentifier() {
    return crypto.randomBytes(16).toString('hex');    
}

module.exports = {
    SEPARATOR,
    generateCode,
    generateIdentifier
};
