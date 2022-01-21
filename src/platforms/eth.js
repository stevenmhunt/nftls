/* eslint-disable no-console */
const silence = console.log;
console.info = function info() {};

const _ = require('lodash');
const EthCrypto = require('eth-crypto');
const { keccak256 } = require('../utils');

// Note: the 'eth-crypto' library outputs to stdout. this code suppresses that output.
console.info = silence;

/**
 * Generates a new Ethereum private key and an Ethereum address.
 * @returns {object}
 */
function generateWallet() {
    return EthCrypto.createIdentity();
}

/**
 * Calculates the contract address from the creator address and nonce.
 * @param {string} address The creator address.
 * @param {number} nonce The nonce.
 * @returns {string}
 */
function getContractAddress(address, nonce) {
    return EthCrypto.calculateContractAddress(address, nonce);
}

/**
 * Given a private key, returns the Ethereum address.
 * @param {string} privateKey The private key.
 * @param {number} nonce (optional) Indicates that the contract address should be calculated.
 * @returns {string}
 */
function getAddress(privateKey, nonce = undefined) {
    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
    const result = EthCrypto.publicKey.toAddress(publicKey);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(nonce)) {
        return getContractAddress(result, nonce);
    }
    return result;
}

/**
 * Given a private key and a message, generates an Ethereum digital signature.
 * @param {string} key The private key.
 * @param {string} msg The message.
 * @returns {string} A digital signature.
 */
function signMessage(key, msg) {
    return EthCrypto.sign(key, keccak256(msg));
}

/**
 * Given a private key and data fields, generates an authorization signature.
 * @param {string} action The action being allowed by the authorization.
 * @param {Array} fields The data fields.
 * @param {string} key The private key.
 * @returns {string} A digital signature.
 */
function signAuthorization(action, fields, key) {
    let data;
    if (action === 'mint') {
        const [recipient, path, version, hash] = fields;
        const newPath = version ? keccak256(Buffer.concat([
            path, version,
        ].map((i) => Buffer.from(i, 'hex')))) : path;
        data = [recipient, newPath, hash];
    } else {
        data = fields;
    }
    const msg = Buffer.concat([keccak256(action), ...data].filter((i) => i).map((i) => Buffer.from(i, 'hex')));
    return signMessage(key, msg);
}

/**
 * Given an Ethereum signature and the original message, recovers the Ethereum address.
 * @param {string} sig The digital signature.
 * @param {string} msg The original message.
 * @param {number} nonce (optional) Indicates that the contract address should be calculated.
 * @returns {string} The recovered Ethereum address.
 */
function recoverAddress(sig, msg, nonce = undefined) {
    const result = EthCrypto.recover(sig, keccak256(msg));
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(nonce)) {
        return getContractAddress(result, nonce);
    }
    return result;
}

function addressesAreEqual(sigAddr, knownAddr, nonce = undefined) {
    if (!sigAddr || !knownAddr) {
        return false;
    }
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(nonce)) {
        return getContractAddress(sigAddr, nonce).toLowerCase() === knownAddr.toLowerCase();
    }
    return sigAddr.toLowerCase() === knownAddr.toLowerCase();
}

/**
 * Returns a list of other blockchain platforms that Ethereum is compatible with.
 * @returns {Array}
 */
function getCompatiblePlatforms() {
    return [];
}

function generateCallData(method, args, values) {
    const methodHash = EthCrypto.hash.keccak256(`${method}(${args.join(',')})`).substring(0, 10);
    const results = values.map((value, i) => {
        if (args[i] === 'uint256') {
            if (_.isString(value)) {
                return value.padStart(64, '0');
            }
            return value.toString(16).padStart(64, '0');
        }
        return value;
    });
    return `${methodHash}${results.join('')}`;
}

module.exports = {
    generateWallet,
    getAddress,
    getContractAddress,
    signMessage,
    signAuthorization,
    recoverAddress,
    addressesAreEqual,
    getCompatiblePlatforms,
    generateCallData,
};
