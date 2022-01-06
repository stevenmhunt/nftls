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

function buildTokenClaims(claims) {
    const result = [];
    _.keys(claims).forEach((key) => {
        result.push(`${key}: ${_.isArray(claims[key]) ? claims[key].join(', ') : claims[key].trim()}`);
    });
    return result.join(SEPARATOR);
}

function extractTokenClaims(data) {
    const result = {};
    data.split(SEPARATOR).forEach((item) => {
        if (item.indexOf(':') >= 0) {
            const key = item.substring(0, item.indexOf(':')).trim();
            result[key] = item.substring(item.indexOf(':') + 1).trim();
            if (result[key] && result[key].indexOf(',') >= 0) {
                result[key] = result[key].split(',').map(i => i.trim());
            }
        }
    });
    return result;
}

module.exports = {
    SEPARATOR,
    generateCode,
    generateSerialNumber,
    buildTokenClaims,
    extractTokenClaims
};
