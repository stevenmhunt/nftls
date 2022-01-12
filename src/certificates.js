const _ = require('lodash');
const fs = require('fs-extra');
const { gzip, ungzip } = require('node-gzip');
const platforms = require('./platforms');
const { encodeImageData, decodeImageData } = require('./img/steganography');
const { extractImageHash, extractImageCode, extractImageSignature } = require('./img/tokens');
const {
    generateSerialNumber, shortenPath, sha256, calculateChainPaths,
} = require('./utils');
const { addKeyItem } = require('./storage');
const { SEPARATOR, requestTypes, certTypes } = require('./constants');

const CERT_KEY = 'certificateCache';
const NO_IMAGE_HASH = 'N/A';
const CSR_VALID_FIELDS = [
    'type', 'subject', 'email', 'imageHash', 'dateRequested', 'forward', 'signature', 'requestAddress', 'requestSignature',
];

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
async function requestCertificate({
    requestType, image, subject, email, data, code, forward,
}, key) {
    // check arguments
    if (!requestTypes[requestType]) { throw new Error(`Invalid request type '${requestType}'.`); }
    if (!image && requestType !== 'ca') { throw new Error('An image path must be provided.'); }
    if (!subject) { throw new Error('Subject information must be provided.'); }
    if (!subject.name) { throw new Error('A subject name must be provided.'); }
    if (!subject.organization) { throw new Error('A subject organization must be provided.'); }
    if (!email) { throw new Error('An email address must be provided.'); }

    // eslint-disable-next-line no-param-reassign
    subject.name = subject.name.toLowerCase();
    // eslint-disable-next-line no-param-reassign
    if (forward) { forward = forward.toLowerCase(); }
    const type = requestTypes[requestType];
    const dateRequested = new Date().toISOString();
    const imageHash = requestType !== 'ca' ? await extractImageHash(image) : sha256(dateRequested + subject.name);

    // build certificate request object.
    const platformName = subject.name.split('@')[1];
    const platform = platforms[platformName];
    const requestAddress = platform.getAddress(key).toLowerCase();
    const payload = {
        type, subject, email, imageHash, dateRequested, data, forward,
    };

    // digitally sign the request.
    const msg = JSON.stringify(payload);
    const signature = platform.signMessage(key, `${code ? code + SEPARATOR : ''}${msg}`);
    const requestSignature = platform.signMessage(key, `${msg}${SEPARATOR}${requestAddress}`);
    return {
        ...payload, signature, requestAddress, requestSignature,
    };
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
    if (!id && request.type === requestTypes.domain) { throw new Error('A token identifier must be provided for domain tokens.'); }
    if (!issuer) { throw new Error('Issuer information must be provided.'); }
    if (!issuer.name) { throw new Error('An issuer name must be provided.'); }
    if (!issuer.organization) { throw new Error('An issuer organization must be provided.'); }
    if (!email) { throw new Error('An email address must be provided.'); }

    // process parameters.
    // eslint-disable-next-line no-param-reassign
    request = _.pick(request, CSR_VALID_FIELDS);
    // eslint-disable-next-line no-param-reassign
    issuer.name = issuer.name.toLowerCase();
    request.subject.name = request.subject.name.toLowerCase();
    if (!id) {
        if (request.type === requestTypes.token && request.subject.name) {
            // eslint-disable-next-line no-param-reassign
            id = request.subject.name;
        }
    } else {
        // eslint-disable-next-line no-param-reassign
        id = id.toLowerCase();
    }

    // validate request
    const platformName = request.subject.name.split('@')[1];
    const platform = platforms[platformName];
    const msg = JSON.stringify({
        type: request.type,
        subject: request.subject,
        email: request.email,
        imageHash: request.imageHash,
        dateRequested: request.dateRequested,
        data: request.data,
        forward: request.forward,
    });
    const actualAddress = platform.recoverAddress(request.requestSignature, `${msg}${SEPARATOR}${request.requestAddress}`);
    if (request.requestAddress !== actualAddress) {
        throw new Error('Inconsistent requestor address.');
    }

    // build the certificate object.
    const certificate = JSON.stringify({
        id,
        ...request,
        type: request.type.replace('Request', 'Certificate'),
        issuer,
        issuerEmail: email,
        dateIssued: new Date().toISOString(),
        serialNumber: generateSerialNumber(),
    });

    // digitally sign the issued certificate.
    const signature = await platform.signMessage(key, certificate);

    return {
        format: 'gzip',
        certificate: (await gzip(Buffer.from(certificate, 'utf8'))).toString('base64'),
        signature,
    };
}

/**
 * Inspects the provided certificate.
 * @param {string} filepath The certificate data or file to read.
 * @returns {Promise<object>} Data about the certificate.
 */
async function inspectCertificate(filepath) {
    let certData = null;
    let hash = null;

    // handle different file types.
    if (_.isObject(filepath)) {
        certData = filepath;
        hash = NO_IMAGE_HASH;
    } else if (filepath.endsWith('.json')) {
        certData = await fs.readJSON(filepath);
        hash = NO_IMAGE_HASH;
    } else if (filepath.endsWith('.png')) {
        certData = JSON.parse(await decodeImageData(filepath));
        hash = await extractImageHash(filepath);
    }

    // handle different certificate formats.
    let result = null;
    if (certData.format === 'gzip') {
        result = {
            certificate: JSON.parse((await ungzip(Buffer.from(certData.certificate, 'base64'))).toString('utf8')),
            signature: certData.signature,
        };
    } else {
        throw new Error(`Unknown certificate format '${certData.format}'.`);
    }

    const cert = result.certificate;
    const {
        type, subject, email, imageHash, dateRequested, data, forward,
    } = cert;
    const [path, platformName] = result.certificate.subject.name.split('@');
    const platform = platforms[platformName];
    const msg = JSON.stringify({
        type: type.replace('Certificate', 'Request'), subject, email, imageHash, dateRequested, data, forward,
    });
    if (type === certTypes.ca) {
        hash = sha256(dateRequested + subject.name);
    }
    const requestSignatureAddress = platform.recoverAddress(cert.requestSignature, `${msg}${SEPARATOR}${cert.requestAddress}`);

    if (hash !== NO_IMAGE_HASH) {
    // recover issuer signature address.
        result.imageHash = hash;
        result.signatureAddress = await platform.recoverAddress(
            result.signature,
            JSON.stringify(result.certificate),
        );

        if (type === certTypes.domain) {
            // extract additional metadata from the domain token image.
            result.code = await extractImageCode(filepath);
            result.signatureMark = await extractImageSignature(filepath);

            // recover requestor and image addresses (they should match...).
            cert.signatureAddress = await platform.recoverAddress(cert.signature, `${result.code ? result.code + SEPARATOR : ''}${msg}`);
            const markMsg = [
                shortenPath(path), platformName, 'NFTLS.IO', result.code,
            ].filter((i) => i).join(SEPARATOR);
            result.signatureMarkAddress = platform.recoverAddress(result.signatureMark, markMsg);
        } else {
            // recover requestor and image addresses (they should match...).
            cert.signatureAddress = await platform.recoverAddress(cert.signature, msg);
        }
    }
    cert.requestSignatureAddress = requestSignatureAddress;

    return result;
}

/**
 * Checks the given certificate to ensure signatures and hashes are correct.
 * @param {string} filepath The certificate file to verify.
 * @param {string} addr (optional) The parent address to verify with.
 * @returns {Promise<string>} Returns "Verified" if verified, otherwise returns an error message.
 */
async function verifyCertificate(filepath, addr) {
    const data = _.isString(filepath) ? await inspectCertificate(filepath) : filepath;

    if (data.imageHash !== data.certificate.imageHash) {
        return 'The SHA-256 hash in the certificate does not match actual hash of the image.';
    }

    if (data.certificate.requestSignatureAddress !== data.certificate.requestAddress) {
        return 'The requestor signature is inconsistent.';
    }

    if (data.certificate.type === certTypes.domain
        && data.certificate.signatureAddress !== data.signatureMarkAddress) {
        return 'The requestor and image signature addresses do not match!';
    }

    if (data.certificate.type === certTypes.ca) {
    // CA certificates are always self-signed.
        if (data.certificate.subject.name !== data.certificate.issuer.name) {
            return 'The subject and issuer names do not match for the CA certificate.';
        }
        if (data.certificate.signatureAddress !== data.signatureAddress) {
            return 'The requestor and issuer addresses do not match for the CA certificate.';
        }
    } else {
    // validate the issuer's path name.
        const [issuerPath, issuerPlatform] = data.certificate.issuer.name.split('@');
        const [subjectPath, subjectPlatform] = data.certificate.subject.name.split('@');
        const paths = calculateChainPaths(subjectPath);
        if (paths.indexOf(issuerPath) === -1) {
            return `The issuer name '${issuerPath}@${issuerPlatform}' is not valid for issuing a certificate for '${data.certificate.subject.name}'.`;
        }

        // validate the issuer's blockchain platform.
        const compatiblePlatforms = platforms[subjectPlatform].getCompatiblePlatforms();
        if (subjectPlatform !== issuerPlatform
            && compatiblePlatforms.indexOf(issuerPlatform) === -1) {
            return `The issuer platform '${issuerPlatform}' is not compatible with subject platform '${subjectPlatform}'.`;
        }
    }

    if (addr) {
        if (data.signatureAddress !== addr.toLowerCase()) {
            return 'Invalid embedded signature address.';
        }
    }

    return 'Verified';
}

/**
 * Installs an issued certificate into the target image.
 * @param {object} cert The certificate to install.
 * @param {string} image The image to install the certificate into.
 * @param {string} output (optional) The output file.
 * @returns {Promise<string>} The name of the installed certificate.
 */
async function installCertificate(cert, image, output) {
    await encodeImageData(image, JSON.stringify(cert), output || image);
    const data = await inspectCertificate(output || image);
    const result = await verifyCertificate(data);
    if (result !== 'Verified') {
        throw new Error(`Failed to install ${data.certificate.subject.name}: ${result}`);
    }

    // write the certificate to the cache.
    // TODO: this will need to be re-evaluated later.
    if (data.certificate.type !== certTypes.token) {
        const key = `${data.certificate.subject.name};${data.signatureAddress}`;
        await addKeyItem(CERT_KEY, key, Buffer.from(JSON.stringify(data)).toString('base64'));
    }
    return data.certificate.subject.name;
}

module.exports = {
    requestCertificate,
    issueCertificate,
    installCertificate,
    inspectCertificate,
    verifyCertificate,
};
