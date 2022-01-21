const {
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    validateCertificate,
} = require('./src/certificates');

const {
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
} = require('./src/certificateAuthorities');

const {
    inspectCertificateChain,
    validateCertificateChain,
} = require('./src/certificateChains');

const {
    renderCertificateToken,
} = require('./src/certificateTokens');

/**
 * NFTLS functions
 */
module.exports = {
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    validateCertificate,
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
    inspectCertificateChain,
    validateCertificateChain,
    renderCertificateToken,
};
