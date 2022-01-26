/* eslint-disable no-console */
const silence = console.log;
console.info = function info() {};

const _ = require('lodash');
const EthCrypto = require('eth-crypto');
const { ethers } = require('ethers');
const { keccak256, toUInt32 } = require('../utils');

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
 * Given a private key, returns the public key.
 * @param {string} privateKey The private key.
 */
function getPublicKey(privateKey) {
    return EthCrypto.publicKeyByPrivateKey(privateKey);
}

/**
 * Given a private key, returns the Ethereum address.
 * @param {string} privateKey The private key.
 * @param {number} nonce (optional) Indicates that the contract address should be calculated.
 * @returns {string}
 */
async function getAddress(privateKey, nonce = undefined) {
    // check if the key is an ethers wallet.
    let result;
    if (privateKey.address) {
        result = privateKey.address;
    } else if (privateKey.getAddress && _.isFunction(privateKey.getAddress)) {
        result = await privateKey.getAddress();
    } else {
        result = EthCrypto.publicKey.toAddress(EthCrypto.publicKeyByPrivateKey(privateKey));
    }

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
async function signMessage(key, msg) {
    // check if the key is an ethers wallet.
    if (key.signMessage && _.isFunction(key.signMessage)) {
        return key.signMessage(msg);
    }
    return EthCrypto.sign(key, ethers.utils.hashMessage(msg));
}

/**
 * Given a private key and data fields, generates an authorization signature.
 * @param {string} action The action being allowed by the authorization.
 * @param {Array} fields The data fields.
 * @param {string} key The private key.
 * @returns {string} A digital signature.
 */
async function signAuthorization(action, fields, key) {
    let data;
    if (action === 'mint') {
        const [recipient, path, version, hash] = fields;
        const versionHex = toUInt32(ethers.BigNumber.from(version || 0).toHexString());
        const newPath = version ? keccak256(Buffer.concat([
            path, versionHex,
        ].map((i) => Buffer.from(i.replace('0x', ''), 'hex')))) : path;
        data = [recipient, newPath, hash];
    } else {
        data = fields;
    }
    const msg = Buffer.concat([keccak256(action), ...data]
        .filter((i) => i).map((i) => Buffer.from(i.replace('0x', ''), 'hex')));
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
    const result = ethers.utils.recoverAddress(ethers.utils.hashMessage(msg), sig);
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(nonce)) {
        return getContractAddress(result, nonce);
    }
    return result;
}

async function encryptMessage(publicKey, msg) {
    return EthCrypto.encryptWithPublicKey(publicKey, msg);
}

async function decryptMessage(key, {
    iv, ephemPublicKey, ciphertext, mac,
}) {
    return EthCrypto.decryptWithPrivateKey(key, {
        iv, ephemPublicKey, ciphertext, mac,
    });
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

module.exports = {
    generateWallet,
    getAddress,
    getPublicKey,
    getContractAddress,
    signMessage,
    signAuthorization,
    recoverAddress,
    encryptMessage,
    decryptMessage,
    addressesAreEqual,
    getCompatiblePlatforms,
};
