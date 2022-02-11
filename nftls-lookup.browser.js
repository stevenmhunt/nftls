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
    resolveCertificateChain,
    validateCertificateChain,
    createSessionContext,
} = require('./src/certificateChains');

const {
    renderCertificateToken,
    authorizeCertificateToken,
} = require('./src/certificateTokens');

/**
 * NFTLS functions
 */
const library = {
    addCachedCertificate,
    removeCachedCertificate,
    getCachedCertificate,
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
    resolveCertificateChain,
    validateCertificateChain,
    createSessionContext,
    renderCertificateToken,
    authorizeCertificateToken,
};

module.exports = library;
