const _ = require('lodash');
const {
    addKeyItem, removeKeyItem, getItems, getKeyItem,
} = require('./storage');
const { inspectCertificate, validateCertificate } = require('./certificates');
const { extractPath } = require('./utils');
const { CA_KEY, CERT_KEY } = require('./constants');

/**
 * Adds a trusted CA for the current user.
 * @param {string} filepath The CA certificate.
 * @param {boolean} isOverwrite Whether or not to overwrite an existing CA with the same name.
 * @returns {Promise<boolean>} Whether or not the CA was written successfully.
 */
async function addCertificateAuthority(filepath, isOverwrite = true) {
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
    if (!isOverwrite && getKeyItem(CA_KEY, caName)) {
        return null;
    }

    // add the CA and also cache the certificate.
    const key = `${ca.certificate.subject.name};${address}`;
    await addKeyItem(CA_KEY, caName, {
        platform: platformName, address, forAddress, status, key,
    });
    await addKeyItem(CERT_KEY, key, Buffer.from(JSON.stringify(ca)).toString('base64'));
    return caName;
}

/**
 * Removes a trusted CA, either by name or address/for.
 * @param {string} name (optional) The name of the CA to remove.
 * @param {string} address (optional) The address of the CA to remove.
 * @param {string} forAddress (optional) The for address of the CA to remove.
 * @returns {Promise<boolean>} Whether or not the CA was removed successfully.
 */
async function removeCertificateAuthority(name) {
    const item = getKeyItem(CA_KEY, name);
    await removeKeyItem(CA_KEY, name);
    await removeKeyItem(CERT_KEY, item.key);
    return true;
}

/**
 * Retrieves a list of all trusted CAs.
 * @returns {Promise<Array>}
 */
async function getCertificateAuthorities() {
    const items = await getItems(CA_KEY);
    return _.keys(items).map((i) => ({ name: i, ...items[i] }));
}

module.exports = {
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities,
};
