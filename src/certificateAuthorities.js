const _ = require('lodash');
const { inspectCertificate, validateCertificate } = require('./certificates');
const { addCachedCertificate, removeCachedCertificate } = require('./cachedCertificates');
const { extractPath } = require('./utils');
const { CA_KEY } = require('./constants');

/**
 * Adds a trusted CA for the current user.
 * @param {object} context The session context.
 * @param {string} filepath The CA certificate.
 * @param {boolean} isOverwrite Whether or not to overwrite an existing CA with the same name.
 * @returns {Promise<boolean>} Whether or not the CA was written successfully.
 */
async function addCertificateAuthority(context, filepath, isOverwrite = true) {
    // validate the CA certificate before adding it.
    const ca = await inspectCertificate(filepath);
    const { platformName } = extractPath(ca.certificate.subject.name);
    const address = ca.certificate.signatureAddress;
    const { status, error } = await validateCertificate(ca, address);
    if (error) {
        throw new Error(error);
    }

    // check overwrite settings and whether or not there is an existing CA.
    const { forAddress } = ca.certificate;
    const caName = ca.certificate.subject.organization;
    if (!isOverwrite && await context.storage.getKeyItem(CA_KEY, caName)) {
        return null;
    }

    // add the CA and also cache the certificate.
    const key = await addCachedCertificate(context, ca, isOverwrite);
    await context.storage.addKeyItem(CA_KEY, caName, {
        platform: platformName, address, forAddress, status, key,
    });
    return caName;
}

/**
 * Removes a trusted CA, either by name or address/for.
 * @param {object} context The session context.
 * @param {string} name (optional) The name of the CA to remove.
 * @returns {Promise<boolean>} Whether or not the CA was removed successfully.
 */
async function removeCertificateAuthority(context, name) {
    const item = await context.storage.getKeyItem(CA_KEY, name);
    await context.storage.removeKeyItem(CA_KEY, name);
    await removeCachedCertificate(item.key);
    return true;
}

/**
 * Retrieves a list of all trusted CAs.
 * @param {object} context The session context.
 * @returns {Promise<Array>}
 */
async function getCertificateAuthorities(context) {
    const items = await context.storage.getItems(CA_KEY);
    return _.keys(items).map((i) => ({ name: i, ...items[i] }));
}

module.exports = {
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
};
