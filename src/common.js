const crypto = require('crypto');

// using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
const SEPARATOR = "\r\n";

function generateNonce() {
    return crypto.randomBytes(4).readUInt32BE();
}

function buildTokenClaims(claims) {
    return claims.join(SEPARATOR);
}

module.exports = {
    SEPARATOR,
    generateNonce,
    buildTokenClaims
};
