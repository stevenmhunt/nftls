const ethWrapper = require('./eth');

module.exports = {
    eth: ethWrapper('eth'),
    polygon: ethWrapper('polygon'),
};
