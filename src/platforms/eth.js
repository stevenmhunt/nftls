/* eslint-disable no-console */
// eslint-disable-next-line global-require
const ethers = typeof window !== 'undefined' && window.ethers ? window.ethers : require('ethers');
const _ = require('lodash');
const ecies = require('../../lib/ecies');
const { keccak256, toUInt32 } = require('../utils');

/**
 * Generates a new Ethereum private key and an Ethereum address.
 * @returns {object}
 */
function generateWallet() {
    const { privateKey, publicKey, address } = ethers.Wallet.createRandom();
    return {
        privateKey, publicKey, address,
    };
}

/**
 * Calculates the contract address from the creator address and nonce.
 * @param {string} from The creator address.
 * @param {number} nonce The nonce.
 * @returns {string}
 */
function getContractAddress(from, nonce) {
    return ethers.utils.getContractAddress({ from, nonce });
}

/**
 * Given a private key, returns the public key.
 * @param {string} privateKey The private key.
 */
function getPublicKey(privateKey) {
    return ethers.utils.computePublicKey(privateKey);
    // return EthCrypto.publicKeyByPrivateKey(privateKey);
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
        result = (new ethers.Wallet(privateKey)).address;
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
    return (new ethers.Wallet(key)).signMessage(msg);
    // return EthCrypto.sign(key, hash);
}

/**
 * @private
 * Generates an authorization message to use for a signature.
 * @param {*} action The action to perform.
 * @param {*} fields The parameters for the action.
 * @returns {string}
 */
function generateAuthorizationMessage(action, fields) {
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
    return Buffer.concat([keccak256(action), ...data]
        .filter((i) => i).map((i) => Buffer.from(i.replace('0x', ''), 'hex')));
}

/**
 * Given a private key and data fields, generates an authorization signature.
 * @param {string} action The action being allowed by the authorization.
 * @param {Array} fields The data fields.
 * @param {string} key The private key.
 * @returns {string} A digital signature.
 */
async function signAuthorization(action, fields, key) {
    const msg = generateAuthorizationMessage(action, fields);
    const signature = await signMessage(key, msg);
    return {
        signature,
        msg,
    };
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

/**
 * Given a signature and authorization message details, recovers the authorization's address.
 * @param {string} sig The signature.
 * @param {string} action The action to authorize.
 * @param {Array} fields The parameters of the action.
 * @returns The recovered address.
 */
async function recoverAuthorizationAddress(sig, action, fields) {
    return recoverAddress(sig, generateAuthorizationMessage(action, fields));
}

/**
 * Use a public key to encrypt a message.
 * @param {*} publicKey The public key.
 * @param {*} msg The message to encrypt.
 * @returns {Promise<object>}
 */
async function encryptMessage(publicKey, msg) {
    return ecies.encrypt(Buffer.from(publicKey.replace('0x', ''), 'hex'), _.isBuffer(msg) ? msg : Buffer.from(msg), {
        curveName: 'secp256k1',
    });
}

/**
 * Decrypts a message using a private key.
 * @param {*} key The private key.
 * @param {*} cipher The encrypted message components.
 * @returns {Promise<string>}
 */
async function decryptMessage(key, {
    iv, ephemPublicKey, ciphertext, mac,
}) {
    return ecies.decrypt(Buffer.from(key.replace('0x', ''), 'hex'), {
        iv, ephemPublicKey, ciphertext, mac,
    }, {
        curveName: 'secp256k1',
    });
}

/**
 * Compares two addresses (or contract address) for equality.
 * @returns {boolean}
 */
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
    recoverAuthorizationAddress,
    encryptMessage,
    decryptMessage,
    addressesAreEqual,
    getCompatiblePlatforms,
};
