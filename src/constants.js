// using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
const SEPARATOR = '\r\n';

const requestTypes = {
    domain: 'NFTLS Domain Request',
    token: 'NFTLS Token Request',
    ca: 'NFTLS CA Request',
};

const certTypes = {
    domain: 'NFTLS Domain Certificate',
    token: 'NFTLS Token Certificate',
    ca: 'NFTLS CA Certificate',
};

module.exports = {
    SEPARATOR,
    requestTypes,
    certTypes,
};
