
const fs = require('fs-extra');
const { buildTokenImage } = require('./img/domainTokens');
const platforms = require('./platforms');
const { generateCode, SEPARATOR } = require('./utils');

async function renderDomainCertificateToken({ name, image }, key, output) {
    const [path, platformName] = name.split('@');
    const platform = platforms[platformName];
    const code = generateCode() || 9999;
    const msg = [path, platformName, 'NFTLS.IO', code].join(SEPARATOR);
    const signature = await platform.signMessage(key, msg);
    await buildTokenImage({
        path, platform: platformName, image, code, signature
    }, output);
    return { code };
}

module.exports = {
    renderDomainCertificateToken
};
