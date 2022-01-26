const crypto = require('crypto');
const os = require('os');
const path = require('path');
const _ = require('lodash');
const keccak256Internal = require('keccak256');

const CA_PATH = '';

/**
 * @private
 * Given a full path, extracts the path and platform values.
 * @param {*} name The full path.
 * @returns {object}
 */
function extractPath(name) {
    const [pathName, platformName] = (name || '').split('@');
    return {
        pathName,
        platformName,
    };
}

/**
 * @private
 * Given a path name, returns a all possible parent paths in order to check a certificate chain.
 * @param {string} name The path name to calculate.
 * @returns {Array} A list of all possible parent paths.
 */
function calculateChainPaths(name) {
    const { pathName } = extractPath(name);
    if (pathName.lastIndexOf('*') > 0) {
        throw new Error('Paths cannot contain the * character except at the beginning.');
    }

    // escape conditions.
    if (pathName === CA_PATH) { return []; }
    if (pathName === '*') { return [CA_PATH]; }

    // analyze wildcard path.
    if (pathName.startsWith('*')) {
        const domains = pathName.split('.');
        if (domains.length <= 2) {
            return ['*', CA_PATH];
        }
        const nextPath = domains.slice(1).join('.');
        return calculateChainPaths(nextPath);
    }

    // analyze targeted token path.
    if (pathName.indexOf('#') >= 0) {
        const [tokenAddress] = pathName.split('#');
        return [tokenAddress, ...calculateChainPaths(tokenAddress)];
    }

    // analyze subdomain path.
    if (pathName.indexOf('.') >= 0) {
        const domains = pathName.split('.');
        domains[0] = '*';
        const nextPath = domains.join('.');
        return [nextPath, ...calculateChainPaths(nextPath)];
    }

    return ['*', CA_PATH];
}

/**
 * @private
 * Generates a 32 bit random number which is used for issuing a code for domain tokens.
 * @returns {number}
 */
function generateCode() {
    return crypto.randomBytes(4).readUInt32BE();
}

/**
 * @private
 * Generates a 128 bit random number which is used for adding entropy to a certificate.
 * @returns {string} the serial number (in hexidecimal)
 */
function generateSerial() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * @private
 * Shortens a path in order to make it easier to display in images.
 * @param {string} pathName The path to display.
 * @returns {string}
 */
function shortenPath(pathName) {
    if (pathName.length > 20) {
        const [addr, num] = pathName.split('#');
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4, addr.length)}${num ? `#${num}` : ''}`.toLowerCase();
    }
    return pathName.toLowerCase();
}

const x509Mapping = {
    CN: 'name',
    O: 'organization',
    OU: 'division',
    C: 'country',
    S: 'state',
    P: 'province',
    L: 'city',
};

function parseX509Fields(data) {
    const result = {};
    data.split(',').map((i) => i.trim().split('=').map((j) => j.trim())).forEach((field) => {
        const [key, value] = field;
        result[x509Mapping[key] || key] = value;
    });
    return result;
}

/**
 * @private
 * Generates a Keccak256 hash for the given value.
 * @param {*} val The value.
 * @returns {string} The hash value (in hexidecimal)
 */
function keccak256(val, type) {
    const result = keccak256Internal(val);
    if (type === 'bytes') {
        return result;
    }
    return `0x${result.toString('hex').padStart('0', 256 / (8 / 2))}`;
}

function toUInt32(value) {
    return value.replace('0x', '').padStart(32 / (8 / 2), '0');
}

function calculatePath(pathName, version = 0) {
    const data = keccak256(pathName);
    if (!version || version <= 0) {
        return data;
    }
    return keccak256(Buffer.concat([
        data,
        toUInt32(version.toString(16)),
    ].map((i) => Buffer.from(i, 'hex'))));
}

function getTempFilePath() {
    return path.join(os.tmpdir(), path.basename(keccak256(generateSerial()).replace('0x', '')));
}

function getCertHash(data, sig) {
    return keccak256(Buffer.concat([
        _.isBuffer(data) ? data : Buffer.from(data, 'base64'),
        Buffer.from(sig.replace('0x', ''), 'hex'),
    ]));
}

function toBase64(str) {
    return Buffer.from(str).toString('base64');
}

module.exports = {
    extractPath,
    calculateChainPaths,
    generateCode,
    generateSerial,
    shortenPath,
    parseX509Fields,
    keccak256,
    getTempFilePath,
    getCertHash,
    toUInt32,
    calculatePath,
    toBase64,
};
