const {
    generateWallet,
    getAddress,
    signMessage,
    recoverAddress
} = require('./eth');

function getCompatiblePlatforms() {
    return ['eth'];
}

module.exports = {
    generateWallet,
    getAddress,
    signMessage,
    recoverAddress,
    getCompatiblePlatforms
};
