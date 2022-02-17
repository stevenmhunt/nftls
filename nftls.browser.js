const {
    getCertificateHash,
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    validateCertificate,
} = require('./src/certificates');

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
    utils,
    platforms,
};

module.exports = library;
