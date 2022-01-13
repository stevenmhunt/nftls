/**
 * using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
 */
const SEPARATOR = '\r\n';

/**
 * NFTLS Certificate Signing Request Types.
 */
const csrTypeMapping = {
    domain: 'NFTLS Domain Request',
    token: 'NFTLS Token Request',
    ca: 'NFTLS CA Request',
};

/**
 * NFTLS Certificate Types.
 */
const certTypeMapping = {
    domain: 'NFTLS Domain Certificate',
    token: 'NFTLS Token Certificate',
    ca: 'NFTLS CA Certificate',
};

module.exports = {
    SEPARATOR,
    csrTypeMapping,
    certTypeMapping,
};
