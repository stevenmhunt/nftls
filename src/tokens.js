const { renderDomainTokenImage } = require('./img/tokens');
const platforms = require('./platforms');
const { generateCode, shortenPath, extractPath } = require('./utils');
const { SEPARATOR } = require('./constants');

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

module.exports = {
    renderCertificateToken,
};
