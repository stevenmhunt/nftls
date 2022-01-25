const { renderDomainTokenImage } = require('./img/tokens');
const platforms = require('./platforms');
const {
    generateCode, shortenPath, extractPath, calculatePath,
} = require('./utils');
const { SEPARATOR } = require('./constants');
const { inspectCertificate, validateCertificate, getCertificateHash } = require('./certificates');

/**
 * Renders a new certificate token image for deployment as an NFT.
 * @param {string} type The certificate type ('address', 'domain', etc.)
 * @param {object} input The configuration of the image.
 * @param {string} key The private key to sign the image with.
 * @param {string} output The output file.
 * @returns {Promise<number>} Returns the randomly generated code associated with the token.
 */
async function renderCertificateToken(type, { name, image, noCode }, key, output) {
    const { pathName, platformName } = extractPath(name);
    const path = shortenPath(pathName);
    const platform = platforms[platformName];
    const code = !noCode ? (generateCode() || 9999) : 0;
    const msg = [path, platformName, 'NFTLS.IO', code].filter((i) => i).join(SEPARATOR);
    const signature = await platform.signMessage(key, msg);
    await renderDomainTokenImage({
        path, platform: platformName, image, code, signature,
    }, output);
    return { code };
}

async function authorizeCertificateToken(certData, signingKey) {
    const data = await inspectCertificate(certData, true);
    const { error } = await validateCertificate(data);
    if (error) {
        throw new Error(`The provided certificate is not valid: ${error}`);
    }
    const { pathName, platformName } = extractPath(data.certificate.subject.name);
    const platform = platforms[platformName];
    const recipient = data.certificate.requestAddress;
    const path = calculatePath(pathName);
    const { version } = data.certificate;
    const hash = await getCertificateHash(data);
    const signature = platform.signAuthorization('mint', [
        recipient,
        path,
        version,
        hash,
    ], signingKey);

    return {
        recipient,
        path,
        version,
        hash,
        signature,
    };
}

module.exports = {
    renderCertificateToken,
    authorizeCertificateToken,
};
