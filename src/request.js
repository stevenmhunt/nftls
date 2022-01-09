
const fs = require('fs-extra');
const { extractImageHash, buildTokenImage } = require('./img/domainToken');
const platforms = require('./platforms');
const { generateCode, SEPARATOR } = require('./utils');

async function requestDomainCertificate(request, key, output) {
    const { image, subject, email, code } = request;
    const type = "NFTLS Domain Request";
    const imageHash = await extractImageHash(image);
    const platformName = subject.name.split('@')[1];
    const platform = platforms[platformName];
    const payload = { type, subject, email, imageHash, dateRequested: new Date().toISOString() };
    const msg = JSON.stringify(payload);
    const signature = await platform.signMessage(key, `${code}${SEPARATOR}${msg}`);
    await fs.writeFile(output, JSON.stringify(Object.assign({}, payload, {
        signature
    }), null, 4), { encoding: 'utf8' });
}

async function requestTokenCertificate(request, key, output) {

}

async function tokenizeDomainCertificate({ name, image }, key, output) {
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
    requestDomainCertificate,
    tokenizeDomainCertificate,
    requestTokenCertificate
};
