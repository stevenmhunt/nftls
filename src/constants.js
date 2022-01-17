const _ = require('lodash');

/**
 * @private
 * using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
 */
const SEPARATOR = '\r\n';

/**
 * @private
 * Prompt text for requesting private key.
 */
const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

/**
 * @private
 * NFTLS Certificate Signing Request mapping.
 */
const csrTypeMapping = {
    ca: 'NFTLS CA Request',
    domain: 'NFTLS Domain Request',
    address: 'NFTLS Address Request',
    token: 'NFTLS Token Request',
};

/**
 * @private
 * NFTLS Certificate mapping.
 */
const certTypeMapping = {
    ca: 'NFTLS CA Certificate',
    domain: 'NFTLS Domain Certificate',
    address: 'NFTLS Address Certificate',
    token: 'NFTLS Token Certificate',
};

/**
 * @private
 * NFTLS Certificate Signing Request types.
 */
const csrTypes = _.values(csrTypeMapping);

/**
 * @private
 * NFTLS Certificate types.
 */
const certTypes = _.values(certTypeMapping);

module.exports = {
    SEPARATOR,
    csrTypeMapping,
    certTypeMapping,
    csrTypes,
    certTypes,
    PRIVATE_KEY_PROMPT,
};
