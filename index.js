const {
    getCertificateHash,
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    validateCertificate,
} = require('./src/certificates');

const {
    addCachedCertificate,
    removeCachedCertificate,
    getCachedCertificate,
} = require('./src/cachedCertificates');

const {
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
} = require('./src/certificateAuthorities');

const {
    inspectCertificateChain,
    validateCertificateChain,
    createSessionContext,
} = require('./src/certificateChains');

const {
    renderCertificateToken,
    authorizeCertificateToken,
} = require('./src/certificateTokens');

const utils = require('./src/utils');
const { extractImageHash } = require('./src/img/tokens');
const platforms = require('./src/platforms');

utils.extractImageHash = extractImageHash;

/**
 * NFTLS functions
 */
const library = {
    getCertificateHash,
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    validateCertificate,
    addCachedCertificate,
    removeCachedCertificate,
    getCachedCertificate,
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
    inspectCertificateChain,
    validateCertificateChain,
    createSessionContext,
    renderCertificateToken,
    authorizeCertificateToken,
    utils,
    platforms,
};

module.exports = library;
