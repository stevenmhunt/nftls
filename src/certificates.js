const _ = require('lodash');
const fs = require('fs-extra');
const { gzip, ungzip } = require('node-gzip');
const platforms = require('./platforms');
const { encodeImageData, decodeImageData } = require('./img/steganography');
const { extractImageHash, extractImageCode, extractImageSignature } = require('./img/tokens');
const {
    generateSerialNumber, shortenPath, extractPath, keccak256, parseX509Fields,
} = require('./utils');
const { addKeyItem } = require('./storage');
const {
    SEPARATOR, CERT_KEY, csrTypeMapping, certTypeMapping,
} = require('./constants');
const { runCertificateRequestValidation, runCertificateValidation } = require('./validators');

const NO_IMAGE_HASH = 'N/A';

/**
 * Generates a certificate signing request (CSR).
 * @param {object} req The request object.
 * @param {string} req.requestType The type of certificate to request.
 * @param {string} req.image The image file where the certificate will be installed.
 * @param {string} req.subject The scope of the certificate and the identity of the requestor.
 * @param {string} req.email The email address of the requestor.
 * @param {number} req.code (optional) A security code typically used for domain tokens.
 * @param {object} keys The keys to use for the request.
 * @param {string} keys.signingKey The private key to sign the request with.
 * @param {string} keys.forKey (optional) The for key, or the same as signingKey.
 * @param {string} keys.encryptForKey (optional) the public key of the issuer to encrypt for.
 * @returns {Promise<object>} The constructed CSR.
 */
async function requestCertificate({
    requestType, version, image, subject, email, data, code, contractNonce,
}, { signingKey, forKey, encryptForKey }) {
    // argument pre-processing
    if (_.isString(subject)) {
        // eslint-disable-next-line no-param-reassign
        subject = parseX509Fields(subject);
    }
    if (subject && subject.name) {
        // eslint-disable-next-line no-param-reassign
        subject.name = subject.name.toLowerCase();
    }

    // validate the request before proceeding.
    runCertificateRequestValidation({
        requestType, version, image, subject, email, data, code, contractNonce,
    }, false);

    const type = csrTypeMapping[requestType];
    const dateRequested = Math.floor(Date.now() / 1000);
    const imageHash = image ? await extractImageHash(image) : undefined;
    const { platformName } = await extractPath(subject.name);
    const platform = platforms[platformName];

    // build certificate request object.
    const requestAddress = platform.getAddress(signingKey);
    const getForAddress = () => {
        // eslint-disable-next-line no-restricted-globals
        if (isNaN(contractNonce)) {
            return forKey ? platform.getAddress(forKey) : undefined;
        }
        return platform.getAddress(forKey || signingKey, contractNonce);
    };
    const forAddress = getForAddress();
    const payload = {
        type, version, subject, email, imageHash, dateRequested, data, contractNonce,
    };

    // digitally sign the request.
    const msg = JSON.stringify(payload);
    const signature = platform.signMessage(signingKey, `${code ? code + SEPARATOR : ''}${msg}`);
    const reqMsg = `${msg}${SEPARATOR}${requestAddress}`;
    const requestSignature = platform.signMessage(signingKey, reqMsg);
    const forSignature = forAddress
        ? platform.signMessage(forKey || signingKey, `${reqMsg}${SEPARATOR}${forAddress}`)
        : undefined;
    const result = {
        ...payload, signature, requestAddress, requestSignature, forAddress, forSignature,
    };

    // perform a final validation of the entire request.
    runCertificateRequestValidation(result);

    // generate encrypted or unencrypted CSR.
    if (encryptForKey) {
        return {
            type: 'encrypted',
            platformName,
            ...(await platform.encryptMessage(encryptForKey, JSON.stringify(result))),
        };
    }
    return result;
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
async function issueCertificate(request, {
    token, isTokenRoot, issuer, email,
}, key) {
    // decrypt if needed
    if (request.type === 'encrypted') {
        const platform = platforms[request.platformName];
        // eslint-disable-next-line no-param-reassign
        request = JSON.parse(await platform.decryptMessage(key, request));
    }

    // argument pre-processing
    if (_.isString(issuer)) {
        // eslint-disable-next-line no-param-reassign
        issuer = parseX509Fields(issuer);
    }
    let platform; let id;
    if (request && request.subject && request.subject.name && issuer && issuer.name) {
        request.subject.name = request.subject.name.toLowerCase();
        const { pathName, platformName } = extractPath(request.subject.name);
        platform = platforms[platformName];
        // eslint-disable-next-line no-param-reassign
        issuer.name = issuer.name.toLowerCase();
        id = token;
        if (!id) {
            if (request.type === csrTypeMapping.token && request.subject.name) {
                id = pathName;
            }
        } else if (isTokenRoot) {
            id = `${token}#0`;
        } else {
            id = `${token}#${keccak256(pathName)}`;
        }
    }

    // build and validate the certificate object.
    const certificateData = {
        id,
        ...request,
        type: request.type.replace('Request', 'Certificate'),
        issuer,
        issuerEmail: email,
        dateIssued: Math.floor(Date.now() / 1000),
        serialNumber: generateSerialNumber(),
    };

    // validate the certificate data before proceeding.
    runCertificateValidation(certificateData);

    // digitally sign the issued certificate.
    const certificate = await gzip(Buffer.from(JSON.stringify(certificateData), 'utf8'));
    const signature = await platform.signMessage(key, certificate);
    return {
        format: 'gzip',
        certificate: certificate.toString('base64'),
        signature,
    };
}

/**
 * Inspects the provided certificate.
 * @param {string} filepath The certificate data or file to read.
 * @returns {Promise<object>} Data about the certificate.
 */
async function inspectCertificate(filepath, includeData = false) {
    let certData = null;
    let hash = null;

    // handle different file types.
    if (_.isObject(filepath)) {
        certData = filepath;
        hash = NO_IMAGE_HASH;
    } else if (filepath.endsWith('.png')) {
        certData = JSON.parse(await decodeImageData(filepath));
        hash = await extractImageHash(filepath);
    } else {
        certData = await fs.readJSON(filepath);
        hash = certData.imageHash || NO_IMAGE_HASH;
    }

    // handle different certificate formats.
    let result = null;
    if (certData.format === 'gzip') {
        const certBytes = Buffer.from(certData.certificate, 'base64');
        result = {
            data: certBytes,
            certificate: JSON.parse((await ungzip(certBytes)).toString('utf8')),
            signature: certData.signature,
        };
    } else {
        throw new Error(`Unknown certificate format '${certData.format}'.`);
    }

    const cert = result.certificate;
    const {
        type, version, subject, email, imageHash, dateRequested, data, contractNonce,
    } = cert;
    const { pathName, platformName } = extractPath(cert.subject.name);
    const platform = platforms[platformName];
    const msg = JSON.stringify({
        type: type.replace('Certificate', 'Request'), version, subject, email, imageHash, dateRequested, data, contractNonce,
    });
    const reqMsg = `${msg}${SEPARATOR}${cert.requestAddress}`;
    // these addresses must be kept out of the 'cert' object until after signature verification.
    const requestSignatureAddress = platform.recoverAddress(cert.requestSignature, reqMsg);
    const forSignatureAddress = cert.forSignature ? platform.recoverAddress(
        cert.forSignature,
        `${reqMsg}${SEPARATOR}${cert.forAddress}`,
    ) : undefined;

    // recover issuer signature address.
    result.signatureAddress = await platform.recoverAddress(
        result.signature,
        result.data,
    );

    if (hash !== NO_IMAGE_HASH) {
        result.imageHash = hash;
        if (type === certTypeMapping.domain) {
            // extract additional metadata from the domain token image.
            result.code = certData.code || await extractImageCode(filepath);
            result.signatureMark = certData.signatureMark || await extractImageSignature(filepath);

            // recover requestor and image addresses (they should match...).
            cert.signatureAddress = await platform.recoverAddress(cert.signature, `${result.code ? result.code + SEPARATOR : ''}${msg}`);
            const markMsg = [
                shortenPath(pathName), platformName, 'NFTLS.IO', result.code,
            ].filter((i) => i).join(SEPARATOR);
            result.signatureMarkAddress = platform.recoverAddress(result.signatureMark, markMsg);
        } else {
            // recover requestor and image addresses (they should match...).
            cert.signatureAddress = await platform.recoverAddress(cert.signature, msg);
        }
    } else if (!cert.imageHash) {
        cert.signatureAddress = await platform.recoverAddress(cert.signature, msg);
    }

    cert.requestSignatureAddress = requestSignatureAddress;
    cert.forSignatureAddress = forSignatureAddress;

    if (!includeData) {
        delete result.data;
    }
    return result;
}

/**
 * Checks the given certificate to ensure signatures and hashes are correct.
 * @param {string} filepath The certificate file to validate.
 * @param {string} addr (optional) The parent address to validate with.
 * @returns {Promise<object>} Returns an 'error' object if invalid.
 */
async function validateCertificate(filepath, addr) {
    const data = (_.isString(filepath) || filepath.format)
        ? await inspectCertificate(filepath)
        : filepath;

    // perform a schema validation of the certificate.
    try {
        runCertificateValidation(data.certificate, data, addr);
    } catch (err) {
        return { status: 'Invalid', error: err.message };
    }

    return { status: 'Valid' };
}

/**
 * Installs an issued certificate into the target image.
 * @param {object} cert The certificate to install.
 * @param {string} image The image to install the certificate into.
 * @param {string} output (optional) The output file.
 * @returns {Promise<string>} The name of the installed certificate.
 */
async function installCertificate(cert, image, options) {
    await encodeImageData(image, JSON.stringify(cert), options.output || image);
    const data = await inspectCertificate(options.output || image);
    const { error } = await validateCertificate(data);
    if (error) {
        throw new Error(`Failed to install ${data.certificate.subject.name}: ${error}`);
    }

    // write the certificate to the cache.
    if (options.cache === true && data.certificate.type !== certTypeMapping.token) {
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
    validateCertificate,
};
