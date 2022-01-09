const _ = require('lodash');
const fs = require('fs-extra');
const platforms = require('./platforms');
const { gzip, ungzip } = require('node-gzip');
const { encodeImageData, decodeImageData } = require('./img/steganography');
const { extractImageHash, extractImageCode, extractImageSignature } = require('./img/domainTokens');
const { SEPARATOR, generateIdentifier } = require('./utils');

const NO_IMAGE_HASH = 'N/A';
const TYPE_DOMAIN_TOKEN = 'NFTLS Domain Request';

/**
 * Generates a certificate request for a domain certificate.
 * @param {object} req The request object.
 * @param {string} req.image The image file where the certificate will be installed.
 * @param {string} req.subject The scope of the certificate and the identity of the requestor.
 * @param {string} req.email The email address of the requestor.
 * @param {number} req.code The code which was generated when rendering the domain token.
 * @param {string} req.forward (optional) An address to forward child certificates to.
 * @param {string} key The private key to sign the request with.
 * @returns {Promise<object>} The domain certificate request.
 */
 async function requestDomainCertificate({ image, subject, email, code, forward }, key) {
    const type = TYPE_DOMAIN_TOKEN;
    const imageHash = await extractImageHash(image);

    // build certificate request object.
    const payload = { type, subject, email, imageHash, dateRequested: new Date().toISOString(), forward };
    const msg = JSON.stringify(payload);

    // digitally sign the request.
    const platformName = subject.name.split('@')[1];
    const platform = platforms[platformName];
    const signature = await platform.signMessage(key, `${code}${SEPARATOR}${msg}`);

    return Object.assign({}, payload, { signature });
}

async function requestTokenCertificate(request, key) {

}

/**
 * Issues a certificate based on the provided certificate request.
 * @param {object} request The certificate request.
 * @param {object} info Data about the issuer.
 * @param {string} info.issuer The scope of the parent certificate and the identity of the issuer.
 * @param {string} key The private key to sign the certificate with.
 * @returns {Promise<object>} The issued certificate.
 */
async function issueCertificate(request, { issuer, email }, key) {
    const type = request.type.replace('Request', 'Certificate');

    // build the certificate object.
    const certificate = JSON.stringify(Object.assign({}, request, {
        type,
        issuer,
        issuerEmail: email,
        dateIssued: new Date().toISOString(),
        id: generateIdentifier()
    }));

    // digitally sign the issued certificate.
    const platformName = request.subject.name.split('@')[1];
    const platform = platforms[platformName];
    const signature = await platform.signMessage(key, certificate);

    return {
        format: 'gzip',
        certificate: (await gzip(Buffer.from(certificate, 'utf8'))).toString('base64'),
        signature
    };
}

/**
 * Inspects the provided certificate.
 * @param {string} filepath The certificate file to read.
 * @returns {Promise<object>} Data about the certificate.
 */
async function inspectCertificate(filepath) {
    let data = null;
    let hash = null;

    // handle different file types.
    if (filepath.endsWith('.json')) {
        data = await fs.readJSON(filepath);
        hash = NO_IMAGE_HASH;
    }
    else if (filepath.endsWith('.png')) {
        data = JSON.parse(await decodeImageData(filepath));
        hash = await extractImageHash(filepath);
    }

    // handle different certificate formats.
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

    const cert = result.certificate;
    const { type, subject, email, imageHash, dateRequested, forward } = cert;

    if (hash !== NO_IMAGE_HASH) {
        const [path, platformName] = result.certificate.subject.name.split('@');
        const platform = platforms[platformName];
        result.imageHash = hash;

        // recover issuer signature address.
        result.signatureAddress = await platform.recoverAddress(result.signature, JSON.stringify(result.certificate));

        if (type === 'NFTLS Domain Certificate') {
            // extract additional metadata from the domain token image.
            result.code = await extractImageCode(filepath);
            result.signatureMark = await extractImageSignature(filepath);
            const msg = JSON.stringify({ type: type.replace('Certificate', 'Request'), subject, email, imageHash, dateRequested, forward });

            // recover requestor and image addresses (they should match...).
            cert.signatureAddress = await platform.recoverAddress(cert.signature, `${result.code}${SEPARATOR}${msg}`);
            result.signatureMarkAddress = platform.recoverAddress(result.signatureMark, [
                path, platformName, 'NFTLS.IO', result.code
            ].join(SEPARATOR));
        }
    }

    return result;
}

/**
 * Checks the given certificate to ensure signatures and hashes are correct.
 * @param {string} filepath The certificate file to verify.
 * @param {string} addr (optional) The parent address to verify with.
 * @returns {string} Returns "Verified" if verified, otherwise returns an error message.
 */
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

/**
 * Installs an issued certificate into the target image.
 * @param {object} cert The certificate to install.
 * @param {string} image The image to install the certificate into.
 * @param {string} output (optional) The output file.
 */
async function installCertificate(cert, image, output) {
    await encodeImageData(image, JSON.stringify(cert), output || image);
    const data = await inspectCertificate(output || image);
    const result = await verifyCertificate(data);
    if (result !== 'Verified') {
        throw new Error(result);
    }
    console.log(` ✓ Certificate for ${data.certificate.subject.name} is installed and verified.`);
}

module.exports = {
    requestDomainCertificate,
    requestTokenCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    verifyCertificate
};
