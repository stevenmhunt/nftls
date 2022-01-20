const { renderDomainTokenImage } = require('./img/tokens');
const platforms = require('./platforms');
const {
    generateCode, shortenPath, extractPath, keccak256,
} = require('./utils');
const { addKeyItem } = require('./storage');
const {
    SEPARATOR, CERT_KEY, certTypeMapping, authorizationTypeMapping,
} = require('./constants');
const { inspectCertificate, verifyCertificate } = require('./certificates');

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

async function authorizeCertificateToken(type, certData, signingKey, options = {}) {
    const data = await inspectCertificate(certData);
    const result = await verifyCertificate(data);
    if (result !== 'Verified') {
        throw new Error(`The provided certificate is not valid: ${result}`);
    }
    const { pathName, platformName } = extractPath(data.certificate.subject.name);
    const platform = platforms[platformName];
    const recipient = data.certificate.requestAddress;
    const path = keccak256(pathName);
    const version = 0;
    const hash = keccak256(data.data);
    const signature = platform.signAuthorization(signingKey, [
        authorizationTypeMapping[type],
        recipient,
        path,
        version,
        hash,
    ]);

    // write the certificate to the cache.
    if (options.cache === true && data.certificate.type !== certTypeMapping.token) {
        const key = `${data.certificate.subject.name};${data.signatureAddress}`;
        await addKeyItem(CERT_KEY, key, Buffer.from(JSON.stringify(data)).toString('base64'));
    }

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
