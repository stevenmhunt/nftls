const fs = require('fs-extra');
const { addRootCA, getStorage } = require('./storage');
const { inspectCertificate } = require('./certificates');

async function addCertificateAuthority(name, filepath) {
    const ca = await inspectCertificate(filepath);
    const rootAddress = ca.certificate.signatureAddress;
    const forward = ca.certificate.forward;
    const caName = name || [rootAddress || forward].filter(i => i).join('/');
    return addRootCA(caName, { rootAddress, forward, data: Buffer.from(JSON.stringify(ca)).toString('base64') })
}

async function removeCertificateAuthority(name, address, forwardAddress) {

}

async function getCertificateAuthorities() {
    return (await getStorage());
}

module.exports = {
    addCertificateAuthority,
    removeCertificateAuthority,
    getCertificateAuthorities
};
