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

const utils = require('./src/utils');
const platforms = require('./src/platforms');

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
    utils,
    platforms,
};
