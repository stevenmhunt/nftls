const _ = require('lodash');

/**
 * using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
 */
const SEPARATOR = '\r\n';

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

/**
 * NFTLS Certificate Signing Request Types.
 */
const csrTypeMapping = {
    ca: 'NFTLS CA Request',
    domain: 'NFTLS Domain Request',
    address: 'NFTLS Address Request',
    token: 'NFTLS Token Request',
};

/**
 * NFTLS Certificate Types.
 */
const certTypeMapping = {
    ca: 'NFTLS CA Certificate',
    domain: 'NFTLS Domain Certificate',
    address: 'NFTLS Address Certificate',
    token: 'NFTLS Token Certificate',
};

const csrTypes = _.values(csrTypeMapping);
const certTypes = _.values(certTypeMapping);

module.exports = {
    SEPARATOR,
    csrTypeMapping,
    certTypeMapping,
    csrTypes,
    certTypes,
    PRIVATE_KEY_PROMPT,
};
