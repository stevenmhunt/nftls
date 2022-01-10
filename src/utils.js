const _ = require('lodash');
const crypto = require('crypto');

// using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
const SEPARATOR = "\r\n";
const CA_PATH = '';

function calculateChainPaths(name) {
    const path = name.split('@')[0];
    if (path.lastIndexOf('*') > 0) {
        throw new Error('Paths cannot contain the * character except at the beginning.');
    }
    if (path === CA_PATH) {
        return [];
    }
    if (path === '*') {
        return [CA_PATH];
    }
    else if (path.startsWith('*')) {
        const domains = path.split('.');
        if (domains.length <= 2) {
            return ['*', CA_PATH];
        }
        const nextPath = domains.slice(1).join('.');
        return calculateChainPaths(nextPath);
    }
    else if (path.indexOf('#') >= 0) {
        const [tokenAddress] = path.split('#');
        return [tokenAddress, ...calculateChainPaths(tokenAddress)];
    }
    else if (path.indexOf('.') >= 0) {
        const domains = path.split('.');
        domains[0] = '*';
        const nextPath = domains.join('.');
        return [nextPath, ...calculateChainPaths(nextPath)];
    }
    else {
        return ['*', CA_PATH];
    }
}

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
