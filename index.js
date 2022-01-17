const {
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    verifyCertificate,
} = require('./src/certificates');

const {
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
} = require('./src/certificateAuthorities');

const {
    inspectCertificateChain,
    verifyCertificateChain,
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
    verifyCertificate,
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
    inspectCertificateChain,
    verifyCertificateChain,
    renderCertificateToken,
};
