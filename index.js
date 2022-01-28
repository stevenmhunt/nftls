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
    acquireSessionContext,
} = require('./src/certificateChains');

const {
    renderCertificateToken,
    authorizeCertificateToken,
} = require('./src/certificateTokens');

const utils = require('./src/utils');
const platforms = require('./src/platforms');

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
    acquireSessionContext,
    renderCertificateToken,
    authorizeCertificateToken,
    utils,
    platforms,
};

if (typeof window !== 'undefined') {
    window.nftls = library;
}
module.exports = library;
