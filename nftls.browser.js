const {
    getCertificateHash,
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    validateCertificate,
} = require('./src/certificates');

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
    utils,
    platforms,
};

module.exports = library;
