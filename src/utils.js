const _ = require('lodash');
const crypto = require('crypto');

// using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
const SEPARATOR = "\r\n";
const CA_PATH = '';

/**
 * Given a path name, returns a list of all possible parent paths in order to determine a certificate chain.
 * @param {string} name The path name to calculate.
 * @returns {Array} A list of all possible parent paths.
 */
function calculateChainPaths(name) {
    const path = name.split('@')[0];
    if (path.lastIndexOf('*') > 0) {
        throw new Error('Paths cannot contain the * character except at the beginning.');
    }
    
    // escape conditions.
    if (path === CA_PATH) { return []; }
    if (path === '*') { return [CA_PATH]; }
    
    // analyze wildcard path.
    if (path.startsWith('*')) {
        const domains = path.split('.');
        if (domains.length <= 2) {
            return ['*', CA_PATH];
        }
        const nextPath = domains.slice(1).join('.');
        return calculateChainPaths(nextPath);
    }

    // analyze targeted token path.
    if (path.indexOf('#') >= 0) {
        const [tokenAddress] = path.split('#');
        return [tokenAddress, ...calculateChainPaths(tokenAddress)];
    }
    
    // analyze subdomain path.
    if (path.indexOf('.') >= 0) {
        const domains = path.split('.');
        domains[0] = '*';
        const nextPath = domains.join('.');
        return [nextPath, ...calculateChainPaths(nextPath)];
    }

    return ['*', CA_PATH];
}

/**
 * Generates a 32 bit random number which is used for issuing a code for domain tokens.
 * @returns {number}
 */
function generateCode() {
    return crypto.randomBytes(4).readUInt32BE();
}

/**
 * Generates a 128 bit random number which is used for adding entropy to a certificate.
 * @returns {string} the serial number (in hexidecimal)
 */
function generateSerialNumber() {
    return crypto.randomBytes(16).toString('hex');    
}

/**
 * Shortens a path in order to make it easier to display in images.
 * @param {string} path The path to display.
 * @returns {string}
 */
function shortenPath(path) {
    if (path.length > 20) {
        const [addr, num] = path.split('#');
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4, addr.length)}${num ? '#' + num : ''}`.toLowerCase();
    }
    return path.toLowerCase();
}

/**
 * Generates a SHA-256 hash for the given value.
 * @param {*} val The value.
 * @returns {string} The hash value (in hexidecimal)
 */
function sha256(val) {
    return crypto.createHash('sha256').update(val).digest().toString('hex');
}

module.exports = {
    SEPARATOR,
    calculateChainPaths,
    generateCode,
    generateSerialNumber,
    shortenPath,
    sha256
};
