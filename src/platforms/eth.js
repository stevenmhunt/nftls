const silence = console.log;
console.info = function() {};
const EthCrypto = require('eth-crypto');
console.info = silence;

function generateWallet() {
    return EthCrypto.createIdentity();
}

function getAddress(privateKey) {
    const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
    return EthCrypto.publicKey.toAddress(publicKey).toLowerCase();
}

function signMessage(key, msg) {
    const hashMsg = EthCrypto.hash.keccak256(msg);
    return EthCrypto.sign(key, hashMsg);
}

function recoverAddress(sig, msg) {
    const hashMsg = EthCrypto.hash.keccak256(msg);
    return EthCrypto.recover(sig, hashMsg).toLowerCase();
}

module.exports = {
    generateWallet,
    getAddress,
    signMessage,
    recoverAddress
};
