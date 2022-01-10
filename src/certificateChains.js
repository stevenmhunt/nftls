const platforms = require('./platforms');
const { inspectCertificate, verifyCertificate } = require("./certificates");
const { getCertificateAuthorities } = require('./certificateAuthorities');
const { calculateChainPaths } = require("./utils");
const { getItems } = require('./storage');

const CERT_KEY = 'certificateCache';

async function resolveCertificateChain(context, { cache, paths }, name, address, targetAddress) {
    console.log(`resolve: ${name}, ${address}`);
    const cert = cache[`${name};${address}`];
    const platform = name.split('@')[1];
    if (!cert) {
        return [null];
    }
    const data = JSON.parse(Buffer.from(cert, 'base64').toString('utf8'));
    if (address === targetAddress) {
        return [data];
    }
    const nextAddress = (data.certificate.signatureAddress).toLowerCase();
    console.log(data.certificate.subject.name);
    return [data,
        ...await resolveCertificateChain(context, { cache, paths: paths.slice(1) }, `${paths[0]}@${platform}`, nextAddress, targetAddress)
    ];
    // TODO: add cycle detection.
}

async function inspectCertificateChain(context, certData) {
    const data = await inspectCertificate(certData);
    if ((await verifyCertificate(data)) !== 'Verified') {
        throw new Error('The provided certificate is not valid.');
    }

    const targetAddress = data.signatureAddress;
    const targetName = data.certificate.subject.name;
    const [certPath, certPlatform] = targetName.split('@');
    const paths = [
        certPath,
        ...calculateChainPaths(certPath),
    ].reverse().slice(1);
    const CAs = (await getCertificateAuthorities())
        .filter(i => i.platform === certPlatform || platforms[certPlatform].getCompatiblePlatforms().indexOf(i.platform) >= 0);
    const cache = await getItems(CERT_KEY);
    for (let i = 0; i < CAs.length; i++) {
        console.log(`target: ${targetAddress}`);
        const certs = await resolveCertificateChain(context, { cache, paths },
            `@${certPlatform}`, CAs[i].address, targetAddress);
        if (certs[certs.length - 1]) {
            return certs;
        }
    }
}

async function verifyCertificateChain(context, certData) {
    const data = inspectCertificateChain(context, certData);
}

module.exports = {
    inspectCertificateChain,
    verifyCertificateChain
};
