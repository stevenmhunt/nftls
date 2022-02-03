const eth = require('./eth');

module.exports = {
    eth,
    'eth:local': eth,
    'eth:private': eth,
    'eth:goerli': eth,
    'eth:kovan': eth,
    'eth:rinkeby': eth,
    'eth:ropsten': eth,
};
