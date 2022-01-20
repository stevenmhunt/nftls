const platforms = require('./platforms');
const { inspectCertificate, verifyCertificate } = require('./certificates');
const { getCertificateAuthorities } = require('./certificateAuthorities');
const { calculateChainPaths, extractPath } = require('./utils');
const { getItems } = require('./storage');
const { CERT_KEY, ROOT_CERT_PATH } = require('./constants');

/**
 * @private
 * Follows a predicted certificate chain path in order to locate and verify certificates.
 * @param {object} context The blockchain connector context.
 * @param {object} inputs The cache data and list of path names to follow.
 * @param {string} name The next path name to find.
 * @param {string} addr The next address to find.
 * @param {string} forAddr The next for address to find.
 * @param {string} target The target address we're trying to reach.
 * @returns {Array} A list of all acquired certificates.
 */
async function resolveCertificateChain(context, { cache, paths }, name, addr, forAddr, target) {
    const { platformName } = extractPath(name);
    if (paths.length === 0 || (addr === target && paths[0] !== ROOT_CERT_PATH)) {
        // if we ran out of paths to validate, then we successfully walked across the chain.
        return [];
    }

    // acquire certificate.
    const cert = cache[`${name};${addr}`]
        || await context[platformName].locateCertificate(name, forAddr || addr);

    // if we don't find a certificate that matches our criteria, then the chain is broken.
    if (!cert) {
        return [null];
    }

    // analyze certificate.
    const data = JSON.parse(Buffer.from(cert, 'base64').toString('utf8'));
    const nextAddress = data.certificate.requestAddress;
    const nextfor = data.certificate.forAddress;
    data.status = await verifyCertificate(data, addr);

    // if something bad happened, then we can't complete the chain.
    if (data.status !== 'Verified') {
        return [null];
    }

    // if we found the target address, then we completed the chain.
    if (addr === target) {
        return [data];
    }

    return [data,
        ...await resolveCertificateChain(
            context,
            { cache, paths: paths.slice(1) },
            `${paths[0]}@${platformName}`,
            nextAddress,
            nextfor,
            target,
        ),
    ];
    // TODO: add cycle detection.
}

/**
 * Inspects certificate chain information for a given certificate.
 * Note: requires an Internet connection.
 * @param {object} context The blockchain connector context.
 * @param {*} certData The certificate to inspect chain data from.
 * @returns {Promise<object>} Any located certificates, as well as whether the chain status.
 */
async function inspectCertificateChain(context, certData) {
    const data = await inspectCertificate(certData);
    if ((await verifyCertificate(data)) !== 'Verified') {
        throw new Error('The provided certificate is not valid.');
    }

    const targetAddress = data.signatureAddress;
    const targetName = data.certificate.subject.name;
    const { pathName: certPath, platformName: certPlatform } = extractPath(targetName);
    const paths = [
        certPath,
        ...calculateChainPaths(certPath),
    ].reverse().slice(1);
    const CAs = (await getCertificateAuthorities())
        .filter((i) => i.platform === certPlatform
            || platforms[certPlatform].getCompatiblePlatforms().indexOf(i.platform) >= 0);
    const cache = await getItems(CERT_KEY);
    // TODO: reseach whether this process could be performed in parallel safely.
    for (let i = 0; i < CAs.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const chain = await resolveCertificateChain(
            context,
            { cache, paths },
            `@${certPlatform}`,
            CAs[i].address,
            CAs[i].forAddress,
            targetAddress,
        );
        if (chain.length === 0 || chain[chain.length - 1]) {
            return { status: 'Complete', chain };
        }
        if (chain.length > 0) {
            return { status: 'Incomplete', chain };
        }
    }
    return { status: 'CA Not Found', chain: [] };
}

/**
 * Verifies whether a certificate and its chain of certificates is valid.
 * @param {object} context The blockchain connector context.
 * @param {*} certData The certificate to verify chain data from.
 * @returns {Promise<string>} Returns "Verified" if verified, otherwise returns an error message.
 */
async function verifyCertificateChain(context, certData) {
    const { status } = await inspectCertificateChain(context, certData);
    if (status === 'Complete') {
        return 'Verified';
    }
    return status;
}

module.exports = {
    inspectCertificateChain,
    verifyCertificateChain,
};
