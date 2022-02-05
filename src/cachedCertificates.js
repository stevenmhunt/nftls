const { inspectCertificate, validateCertificate } = require('./certificates');
const { CERT_KEY } = require('./constants');

/**
 * Adds a cached certificate for the current session.
 * @param {object} context The session context.
 * @param {string} filepath The certificate.
 * @param {boolean} isOverwrite Whether or not to overwrite a certificate with the same name.
 * @returns {Promise<boolean>} Whether or not the certificate was written successfully.
 */
async function addCachedCertificate(context, filepath, isOverwrite = true) {
    // validate the certificate before adding it.
    const data = await inspectCertificate(filepath);
    const { error } = await validateCertificate(data);
    if (error) {
        throw new Error(error);
    }

    // check overwrite settings and whether or not there is an existing certificate.
    const key = data.certificate.subject.name;
    if (!isOverwrite && await context.storage.getKeyItem(CERT_KEY, key)) {
        return null;
    }

    // add the certificate.
    await context.storage.addKeyItem(CERT_KEY, key, Buffer.from(JSON.stringify(data)).toString('base64'));
    return key;
}

/**
 * Removes a certificate by name.
 * @param {object} context The session context.
 * @param {string} name The name of the certificate to remove.
 * @returns {Promise<boolean>} Whether or not the certificate was removed successfully.
 */
async function removeCachedCertificate(context, name) {
    await context.storage.removeKeyItem(CERT_KEY, name);
    return true;
}

/**
 * Retrieves a cached certificate if available.
 * @param {object} context The session context.
 * @returns {Promise<object>}
 */
async function getCachedCertificate(context, name) {
    const data = await context.storage.getKeyItem(CERT_KEY, name);
    if (!data) {
        return null;
    }
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
}

module.exports = {
    addCachedCertificate,
    removeCachedCertificate,
    getCachedCertificate,
};
