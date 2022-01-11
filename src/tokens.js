
const fs = require('fs-extra');
const { renderDomainTokenImage } = require('./img/tokens');
const platforms = require('./platforms');
const { generateCode, SEPARATOR, shortenPath } = require('./utils');

async function renderDomainCertificateToken({ name, image, noCode }, key, output) {
    const [longPath, platformName] = name.split('@');
    const path = shortenPath(longPath);
    const platform = platforms[platformName];
    const code = !noCode ? (generateCode() || 9999) : 0;
    const msg = [path, platformName, 'NFTLS.IO', code].filter(i => i).join(SEPARATOR);
    const signature = await platform.signMessage(key, msg);
    await renderDomainTokenImage({
        path, platform: platformName, image, code, signature
    }, output);
    return { code };
}

module.exports = {
    renderDomainCertificateToken
};
