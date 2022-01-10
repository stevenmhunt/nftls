const _ = require('lodash');
const fs = require('fs-extra');
const platforms = require('./platforms');
const { gzip, ungzip } = require('node-gzip');
const { encodeImageData, decodeImageData } = require('./img/steganography');
const { extractImageHash, extractImageCode, extractImageSignature } = require('./img/tokens');
const { SEPARATOR, generateSerialNumber, shortenPath, sha256, calculateChainPaths } = require('./utils');
const { addKeyItem } = require('./storage');

const CERT_KEY = 'certificateCache';
const NO_IMAGE_HASH = 'N/A';
const requestTypes = {
    domain: 'NFTLS Domain Request',
    token: 'NFTLS Token Request',
    ca: 'NFTLS CA Request'
};

/**
 * Generates a certificate request for a domain certificate.
 * @param {object} req The request object.
 * @param {string} req.requestType The type of certificate to request.
 * @param {string} req.image The image file where the certificate will be installed.
 * @param {string} req.subject The scope of the certificate and the identity of the requestor.
 * @param {string} req.email The email address of the requestor.
 * @param {number} req.code The code which was generated when rendering the domain token.
 * @param {string} req.forward (optional) An address to forward child certificates to.
 * @param {string} key The private key to sign the request with.
 * @returns {Promise<object>} The domain certificate request.
 */
 async function requestCertificate({ requestType, image, subject, email, code, forward }, key) {
    // check arguments
    if (!requestTypes[requestType]) { throw new Error(`Invalid request type '${requestType}'.`); }
    if (!image && requestType !== 'ca') { throw new Error('An image path must be provided.'); }
    if (!subject) { throw new Error('Subject information must be provided.'); }
    if (!subject.name) { throw new Error('A subject name must be provided.'); }
    if (!subject.organization) { throw new Error('A subject organization must be provided.'); }
    if (!email) { throw new Error('An email address must be provided.'); }

    subject.name = subject.name.toLowerCase();
    if (subject.forward) { subject.forward = subject.forward.toLowerCase(); }
    const type = requestTypes[requestType];
    const dateRequested = new Date().toISOString();
    const imageHash = requestType !== 'ca' ? await extractImageHash(image) : sha256(dateRequested + subject.name);

    // build certificate request object.
    const payload = { type, subject, email, imageHash, dateRequested, forward };
    const msg = JSON.stringify(payload);

    // digitally sign the request.
    const platformName = subject.name.split('@')[1];
    const platform = platforms[platformName];
    const signature = await platform.signMessage(key, `${code ? code + SEPARATOR : ''}${msg}`);

    return Object.assign({}, payload, { signature });
}

/**
 * Issues a certificate based on the provided certificate request.
 * @param {object} request The certificate request.
 * @param {object} info Data about the issuer.
 * @param {string} info.id The NFT address and token number associated with the certificate.
 * @param {string} info.issuer The scope of the parent certificate and the identity of the issuer.
 * @param {string} info.email The email address of the issuer.
 * @param {string} key The private key to sign the certificate with.
 * @returns {Promise<object>} The issued certificate.
 */
async function issueCertificate(request, { id, issuer, email }, key) {
    // check arguments
    if (!id && request.type == requestTypes.domain) { throw new Error('A token identifier must be provided for domain tokens.'); }
    if (!issuer) { throw new Error('Issuer information must be provided.'); }
    if (!issuer.name) { throw new Error('An issuer name must be provided.'); }
    if (!issuer.organization) { throw new Error('An issuer organization must be provided.'); }
    if (!email) { throw new Error('An email address must be provided.'); }

    issuer.name = issuer.name.toLowerCase();
    request.subject.name = request.subject.name.toLowerCase();
    if (!id) {
        if (request.type == requestTypes.token && request.subject.name) {
            id = request.subject.name;
        }
    }
    else {
        id = id.toLowerCase();
    }

    // build the certificate object.
    const certificate = JSON.stringify(Object.assign({ id }, request, {
        type: request.type.replace('Request', 'Certificate'),
        issuer,
        issuerEmail: email,
        dateIssued: new Date().toISOString(),
        serialNumber: generateSerialNumber()
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
 * @param {string} certData The certificate data or file to read.
 * @returns {Promise<object>} Data about the certificate.
 */
async function inspectCertificate(certData) {
    let data = null;
    let hash = null;

    // handle different file types.
    if (_.isObject(certData)) {
        data = certData;
        hash = NO_IMAGE_HASH;
    }
    else if (certData.endsWith('.json')) {
        data = await fs.readJSON(certData);
        hash = NO_IMAGE_HASH;
    }
    else if (certData.endsWith('.png')) {
        data = JSON.parse(await decodeImageData(certData));
        hash = await extractImageHash(certData);
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
    if (type === 'NFTLS CA Certificate') {
        hash = sha256(dateRequested + subject.name);
    }

    if (hash !== NO_IMAGE_HASH) {
        const [path, platformName] = result.certificate.subject.name.split('@');
        const platform = platforms[platformName];
        const msg = JSON.stringify({
            type: type.replace('Certificate', 'Request'), subject, email, imageHash, dateRequested, forward
        });
        result.imageHash = hash;

        // recover issuer signature address.
        result.signatureAddress = await platform.recoverAddress(result.signature, JSON.stringify(result.certificate));

        if (type === 'NFTLS Domain Certificate') {
            // extract additional metadata from the domain token image.
            result.code = await extractImageCode(certData);
            result.signatureMark = await extractImageSignature(certData);

            // recover requestor and image addresses (they should match...).
            cert.signatureAddress = await platform.recoverAddress(cert.signature, `${result.code}${SEPARATOR}${msg}`);
            const markMsg = [
                shortenPath(path), platformName, 'NFTLS.IO', result.code
            ].join(SEPARATOR);
            result.signatureMarkAddress = platform.recoverAddress(result.signatureMark, markMsg);
        }
        else {
            // recover requestor and image addresses (they should match...).
            cert.signatureAddress = await platform.recoverAddress(cert.signature, msg);
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

    if (data.certificate.type === 'NFTLS Domain Certificate' &&
        data.certificate.signatureAddress !== data.signatureMarkAddress) {
        return `The requestor and image signature addresses do not match!`;
    }

    if (data.certificate.type === 'NFTLS CA Certificate') {
        if (data.certificate.subject.name !== data.certificate.issuer.name) {
            return `The subject and issuer names do not match for the CA certificate.`;
        }
    }
    else {
        const [issuerPath, issuerPlatform] = data.certificate.issuer.name.split('@');
        const [subjectPath, subjectPlatform] = data.certificate.subject.name.split('@');
        const paths = calculateChainPaths(subjectPath);
        if (paths.indexOf(issuerPath) === -1) {
            return `The issuer name '${issuerPath}@${issuerPlatform}' is not valid for issuing a certificate for '${data.certificate.subject.name}'.`;
        }
        const compatiblePlatforms = platforms[subjectPlatform].getCompatiblePlatforms();
        if (subjectPlatform !== issuerPlatform && compatiblePlatforms.indexOf(issuerPlatform) === -1) {
            return `The issuer platform '${issuerPlatform}' is not compatible with subject platform '${subjectPlatform}'.`;
        }
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
        throw new Error(`Failed to install ${data.certificate.subject.name}: ${result}`);
    }
    const key = `${data.certificate.subject.name};${data.signatureAddress}`;
    await addKeyItem(CERT_KEY, key, Buffer.from(JSON.stringify(data)).toString('base64'))
    console.log(` ✓ Certificate for ${data.certificate.subject.name} is installed and verified.`);
}

module.exports = {
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    verifyCertificate
};
