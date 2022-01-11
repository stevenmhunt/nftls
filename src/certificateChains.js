const platforms = require('./platforms');
const { inspectCertificate, verifyCertificate } = require("./certificates");
const { getCertificateAuthorities } = require('./certificateAuthorities');
const { calculateChainPaths } = require("./utils");
const { getItems } = require('./storage');

const CERT_KEY = 'certificateCache';

/**
 * @private
 * Follows a predicted certificate chain path in order to locate and verify certificates in the chain.
 * @param {*} context Blockchain connector.
 * @param {*} inputs The cache data and list of path names to follow.
 * @param {*} name The next path name to find.
 * @param {*} address The next address to find.
 * @param {*} targetAddress The target address we're trying to reach.
 * @returns {Array} A list of all acquired certificates. The last element is null if the chain is broken.
 */
async function resolveCertificateChain(context, { cache, paths }, name, address, targetAddress) {
    const platform = name.split('@')[1];
    if (paths.length === 0) {
        return [];
    }

    // acquire certificate.
    const cert = cache[`${name};${address}`] || await context[platform].locateCertificate(name, address);
    if (!cert) {
        return [null];
    }

    // analyze certificate.
    const data = JSON.parse(Buffer.from(cert, 'base64').toString('utf8'));
    data.status = await verifyCertificate(data, address);
    if (address === targetAddress) {
        return [data];
    }
    const nextAddress = (data.certificate.signatureAddress).toLowerCase();
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
        const chain = await resolveCertificateChain(context, { cache, paths },
            `@${certPlatform}`, CAs[i].address, targetAddress);
        if (chain.length === 0 || chain[chain.length - 1]) {
            return { status: 'Complete', chain };
        }
        return { status: 'Incomplete', chain };
    }
}

async function verifyCertificateChain(context, certData) {
    const { status } = await inspectCertificateChain(context, certData);
    if (status === 'Complete') {
        return 'Verified';
    }
    return status;
}

module.exports = {
    inspectCertificateChain,
    verifyCertificateChain
};
