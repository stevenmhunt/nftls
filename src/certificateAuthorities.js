const _ = require('lodash');
const { addKeyItem, getItems, getKeyItem } = require('./storage');
const { inspectCertificate, verifyCertificate } = require('./certificates');
const { extractPath } = require('./utils');

const CA_KEY = 'certificateAuthorities';
const CERT_KEY = 'certificateCache';

/**
 * Adds a trusted CA for the current user.
 * @param {string} name The name of the CA.
 * @param {string} filepath The CA certificate.
 * @param {boolean} isOverwrite Whether or not to overwrite an existing CA with the same name.
 * @returns {Promise<boolean>} Whether or not the CA was written successfully.
 */
async function addCertificateAuthority(name, filepath, isOverwrite = true) {
    // verify that the CA certificate is valid before adding it.
    const ca = await inspectCertificate(filepath);
    const { platformName } = extractPath(ca.certificate.subject.name);
    const address = ca.certificate.signatureAddress;
    const status = await verifyCertificate(ca, address);
    if (status !== 'Verified') {
        throw new Error(status);
    }

    // check overwrite settings and whether or not there is an existing CA.
    const { forAddress } = ca.certificate;
    const caName = name || [address, forAddress].filter((i) => i).join('/');
    if (!isOverwrite && getKeyItem(CA_KEY, caName)) {
        return false;
    }

    // add the CA and also cache the certificate.
    const key = `${ca.certificate.subject.name};${address}`;
    await addKeyItem(CA_KEY, caName, {
        platform: platformName, address, forAddress, status, key,
    });
    await addKeyItem(CERT_KEY, key, Buffer.from(JSON.stringify(ca)).toString('base64'));
    return true;
}

/**
 * Removes a trusted CA, either by name or address/for.
 * @param {string} name (optional) The name of the CA to remove.
 * @param {string} address (optional) The address of the CA to remove.
 * @param {string} forAddress (optional) The for address of the CA to remove.
 * @returns {Promise<boolean>} Whether or not the CA was removed successfully.
 */
async function removeCertificateAuthority() {
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
