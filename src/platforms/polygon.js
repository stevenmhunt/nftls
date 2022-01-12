const {
    generateWallet,
    getAddress,
    signMessage,
    recoverAddress,
} = require('./eth');

/**
 * Returns a list of other blockchain platforms that Polygon is compatible with.
 * @returns {Array}
 */
function getCompatiblePlatforms() {
    return ['eth'];
}

module.exports = {
    generateWallet,
    getAddress,
    signMessage,
    recoverAddress,
    getCompatiblePlatforms,
};
