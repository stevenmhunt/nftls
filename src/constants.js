const _ = require('lodash');

/**
 * @private
 * using CRLF in order to maintain compatibility with https://etherscan.io/verifySig
 */
const SEPARATOR = '\r\n';

const CA_KEY = 'certificateAuthorities';
const CERT_KEY = 'certificateCache';
const PLATFORMS_KEY = 'platforms';
const ROOT_CERT_PATH = '*';

const STDIO_ARG = '****STDIO****';

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
    STDIO_ARG,
    CA_KEY,
    CERT_KEY,
    PLATFORMS_KEY,
    ROOT_CERT_PATH,
    csrTypeMapping,
    certTypeMapping,
    csrTypes,
    certTypes,
    PRIVATE_KEY_PROMPT,
};
