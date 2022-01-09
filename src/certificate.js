const _ = require('lodash');
const fs = require('fs-extra');
const platforms = require('./platforms');
const { gzip, ungzip } = require('node-gzip');
const { encodeImageData, decodeImageData } = require('./img/steganography');
const { extractImageHash, extractImageCode, extractImageSignature } = require('./img/domainToken');
const { SEPARATOR, generateIdentifier } = require('./utils');

const NO_IMAGE_HASH = 'N/A';

async function issueCertificate(request, { issuer, email }, key, output) {
    const platformName = request.subject.name.split('@')[1];
    const platform = platforms[platformName];
    const certificate = JSON.stringify(Object.assign({}, request, {
        type: request.type.replace('Request', 'Certificate'),
        issuer,
        issuerEmail: email,
        dateIssued: new Date().toISOString(),
        id: generateIdentifier()
    }));
    const signature = await platform.signMessage(key, certificate);
    await fs.writeFile(output, JSON.stringify({
        format: 'gzip',
        certificate: (await gzip(Buffer.from(certificate, 'utf8'))).toString('base64'),
        signature
    }));
}

async function renderCertificate(cert, image, output) {
    await encodeImageData(image, JSON.stringify(cert), output || image);
}

async function inspectCertificate(filepath) {
    let data = null;
    let hash = null;
    if (filepath.endsWith('.json')) {
        data = await fs.readJSON(filepath);
        hash = NO_IMAGE_HASH;
    }
    else if (filepath.endsWith('.png')) {
        data = JSON.parse(await decodeImageData(filepath));
        hash = await extractImageHash(filepath);
    }

    let result = null;
    if (data.format === 'gzip') {
        result = {
            certificate: JSON.parse((await ungzip(Buffer.from(data.certificate, 'base64'))).toString('utf8')),
            signature: data.signature
        }
    }
    else {
        throw new Error(`Unknown certificate format '${data.format}'.`);
    }

    const [path, platformName] = result.certificate.subject.name.split('@');
    const platform = platforms[platformName];
    const cert = result.certificate;
    const { type, subject, email, imageHash, dateRequested } = cert;

    if (hash !== NO_IMAGE_HASH) {
        result.signatureAddress = await platform.recoverAddress(result.signature, JSON.stringify(result.certificate));
        const msg = JSON.stringify({ type: type.replace('Certificate', 'Request'), subject, email, imageHash, dateRequested });

        if (type === 'NFTLS Domain Certificate') {
            const code = await extractImageCode(filepath);
            const sigmark = await extractImageSignature(filepath);
            cert.signatureAddress = await platform.recoverAddress(cert.signature, `${code}${SEPARATOR}${msg}`);
            result.signatureMark = sigmark;
            result.signatureMarkAddress = platform.recoverAddress(result.signatureMark, [
                path, platformName, 'NFTLS.IO', code
            ].join(SEPARATOR));
            result.code = code;
        }

        result.imageHash = hash;
    }

    return result;
}

async function verifyCertificate(filepath, addr) {
    const data = _.isString(filepath) ? await inspectCertificate(filepath) : filepath;

    if (data.imageHash !== data.certificate.imageHash) {
        return `The SHA-256 hash in the certificate does not match actual hash of the image.`;
    }

    if (data.certificate.signatureAddress !== data.signatureMarkAddress) {
        return `The requestor and image signature addresses do not match!`;
    }

    if (addr) {
        if (data.signatureAddress !== addr.toLowerCase()) {
            return `Invalid embedded signature address.`;
        }
    }

    return 'Verified';
}

module.exports = {
    issueCertificate,
    renderCertificate,
    inspectCertificate,
    verifyCertificate
};
