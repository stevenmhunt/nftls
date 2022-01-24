const { inspectCertificate, validateCertificate } = require('./certificates');
const { CERT_KEY } = require('./constants');

/**
 * Adds a cached certificate for the current session.
 * @param {object} context The session context.
 * @param {string} filepath The CA certificate.
 * @param {boolean} isOverwrite Whether or not to overwrite a certificate with the same name.
 * @returns {Promise<boolean>} Whether or not the CA was written successfully.
 */
async function addCachedCertificate(context, filepath, isOverwrite = true) {
    // validate the certificate before adding it.
    const data = await inspectCertificate(filepath);
    const { error } = await validateCertificate(data);
    if (error) {
        throw new Error(error);
    }

    // check overwrite settings and whether or not there is an existing CA.
    const key = `${data.certificate.subject.name};${data.signatureAddress}`;
    if (!isOverwrite && await context.storage.getKeyItem(CERT_KEY, key)) {
        return null;
    }

    // add the CA and also cache the certificate.
    await context.storage.addKeyItem(CERT_KEY, key, Buffer.from(JSON.stringify(data)).toString('base64'));
    return key;
}

/**
 * Removes a trusted CA, either by name or address/for.
 * @param {object} context The session context.
 * @param {string} name (optional) The name of the CA to remove.
 * @returns {Promise<boolean>} Whether or not the CA was removed successfully.
 */
async function removeCachedCertificate(context, name, address) {
    const key = !address ? name : `${name};${address}`;
    await context.storage.removeKeyItem(CERT_KEY, key);
    return true;
}

/**
 * Retrieves a list of all trusted CAs.
 * @param {object} context The session context.
 * @returns {Promise<Array>}
 */
async function getCachedCertificate(context, name, address) {
    const key = !address ? name : `${name};${address}`;
    const data = await context.storage.getKeyItem(CERT_KEY, key);
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
