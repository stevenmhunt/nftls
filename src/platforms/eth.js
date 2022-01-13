/* eslint-disable no-console */
const _ = require('lodash');

const silence = console.log;
console.info = function info() {};
const EthCrypto = require('eth-crypto');

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
 * Given a private key, returns the Ethereum address.
 * @param {string} privateKey The private key.
 * @returns {string}
 */
function getAddress(privateKey) {
    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
    return EthCrypto.publicKey.toAddress(publicKey).toLowerCase();
}

/**
 * Given a private key and a message, generates an Ethereum digital signature.
 * @param {string} key The private key.
 * @param {string} msg The message.
 * @returns {string} A digital signature.
 */
function signMessage(key, msg) {
    const hashMsg = EthCrypto.hash.keccak256(msg);
    return EthCrypto.sign(key, hashMsg);
}

/**
 * Given an Ethereum signature and the original message, recovers the Ethereum address.
 * @param {string} sig The digital signature.
 * @param {string} msg The original message.
 * @returns {string} The recovered Ethereum address.
 */
function recoverAddress(sig, msg) {
    const hashMsg = EthCrypto.hash.keccak256(msg);
    return EthCrypto.recover(sig, hashMsg).toLowerCase();
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
    signMessage,
    recoverAddress,
    getCompatiblePlatforms,
    generateCallData,
};
