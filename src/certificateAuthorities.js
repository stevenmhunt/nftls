const _ = require('lodash');
const { addKeyItem, getItems } = require('./storage');
const { inspectCertificate, verifyCertificate } = require('./certificates');

const CA_KEY = 'certificateAuthorities';
const CERT_KEY = 'certificateCache';

async function addCertificateAuthority(name, filepath, isOverwrite = true) {
    const ca = await inspectCertificate(filepath);
    const platform = ca.certificate.subject.name.split('@')[1];
    const address = ca.certificate.signatureAddress;
    const status = await verifyCertificate(ca, address);
    if (status !== 'Verified') {
        throw new Error(status);
    }
    const forward = ca.certificate.forward;
    const caName = name || [address, forward].filter(i => i).join('/');
    if (!isOverwrite && getKeyItem(CA_KEY, caName)) {
        return false;
    }
    const key = `${ca.certificate.subject.name};${address}`;
    await addKeyItem(CA_KEY, caName, { platform, address, forward, status, key });
    await addKeyItem(CERT_KEY, key, Buffer.from(JSON.stringify(ca)).toString('base64'));
    return true;
}

async function removeCertificateAuthority(name, address, forwardAddress) {

}

async function getCertificateAuthorities() {
    const items = await getItems(CA_KEY);
    return _.keys(items).map(i => Object.assign({}, {
        name: i,
    }, items[i]));
}

module.exports = {
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities
};
