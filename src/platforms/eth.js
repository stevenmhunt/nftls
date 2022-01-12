const silence = console.log;
console.info = function() {};
const EthCrypto = require('eth-crypto');
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
 * Given an Ethereum signature and the original message, recovers the Ethereum address that created the signature.
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

module.exports = {
    generateWallet,
    getAddress,
    signMessage,
    recoverAddress,
    getCompatiblePlatforms
};
