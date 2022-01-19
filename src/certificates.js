const _ = require('lodash');
const fs = require('fs-extra');
const { gzip, ungzip } = require('node-gzip');
const platforms = require('./platforms');
const { encodeImageData, decodeImageData } = require('./img/steganography');
const { extractImageHash, extractImageCode, extractImageSignature } = require('./img/tokens');
const {
    generateSerialNumber, shortenPath, sha256, calculateChainPaths, extractPath, keccak256,
} = require('./utils');
const { addKeyItem } = require('./storage');
const { SEPARATOR, csrTypeMapping, certTypeMapping } = require('./constants');
const csrSchemaFactory = require('./schemas/csrSchema');
const certificateSchemaFactory = require('./schemas/certificateSchema');

const CERT_KEY = 'certificateCache';
const NO_IMAGE_HASH = 'N/A';

/**
 * Generates a certificate signing request (CSR).
 * @param {object} req The request object.
 * @param {string} req.requestType The type of certificate to request.
 * @param {string} req.image The image file where the certificate will be installed.
 * @param {string} req.subject The scope of the certificate and the identity of the requestor.
 * @param {string} req.email The email address of the requestor.
 * @param {number} req.code (optional) A security code typically used for domain tokens.
 * @param {string} signingKey The private key to sign the request with.
 * @param {string} forKey (optional) The for key, or the same as signingKey.
 * @returns {Promise<object>} The constructed CSR.
 */
async function requestCertificate({
    requestType, image, subject, email, data, code, contractNonce,
}, signingKey, forKey = undefined) {
    // check arguments
    if (!csrTypeMapping[requestType]) { throw new Error(`Invalid request type '${requestType}'.`); }
    if (!image && requestType !== 'ca') { throw new Error('An image path must be provided.'); }
    if (!subject) { throw new Error('Subject information must be provided.'); }
    if (!subject.name) { throw new Error('A subject name must be provided.'); }
    if (!subject.organization) { throw new Error('A subject organization must be provided.'); }
    if (!email) { throw new Error('An email address must be provided.'); }

    // eslint-disable-next-line no-param-reassign
    subject.name = subject.name.toLowerCase();
    // eslint-disable-next-line no-param-reassign
    const type = csrTypeMapping[requestType];
    const dateRequested = Math.floor(Date.now() / 1000);
    const imageHash = requestType !== 'ca' ? await extractImageHash(image) : sha256(dateRequested + subject.name);

    // build certificate request object.
    const { platformName } = extractPath(subject.name);
    const platform = platforms[platformName];
    const requestAddress = platform.getAddress(signingKey, !forKey ? contractNonce : undefined);
    const getForAddress = () => {
        // eslint-disable-next-line no-restricted-globals
        if (isNaN(contractNonce)) {
            return forKey ? platform.getAddress(forKey) : undefined;
        }
        return platform.getAddress(forKey || signingKey, contractNonce);
    };
    const forAddress = getForAddress();
    const payload = {
        type, subject, email, imageHash, dateRequested, data, contractNonce,
    };

    // digitally sign the request.
    const msg = JSON.stringify(payload);
    const signature = platform.signMessage(signingKey, `${code ? code + SEPARATOR : ''}${msg}`);
    const reqMsg = `${msg}${SEPARATOR}${requestAddress}`;
    const requestSignature = platform.signMessage(signingKey, reqMsg);
    const forSignature = forKey
        ? platform.signMessage(forKey, `${reqMsg}${SEPARATOR}${forAddress}`)
        : undefined;
    return {
        ...payload, signature, requestAddress, requestSignature, forAddress, forSignature,
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
async function issueCertificate(request, {
    token, isTokenRoot, issuer, email,
}, key) {
    // check arguments
    if (!token && request.type === csrTypeMapping.domain) { throw new Error('A token contract address must be provided for domain tokens.'); }
    if (!issuer) { throw new Error('Issuer information must be provided.'); }
    if (!issuer.name) { throw new Error('An issuer name must be provided.'); }
    if (!issuer.organization) { throw new Error('An issuer organization must be provided.'); }
    if (!email) { throw new Error('An email address must be provided.'); }

    // process parameters.
    request.subject.name = request.subject.name.toLowerCase();
    const { pathName, platformName } = extractPath(request.subject.name);
    const schema = csrSchemaFactory(platformName);
    const { error } = schema.validate(request);
    if (error) {
        throw new Error(`CSR${error}`);
    }

    // eslint-disable-next-line no-param-reassign
    issuer.name = issuer.name.toLowerCase();
    let id = token;
    if (!id) {
        if (request.type === csrTypeMapping.token && request.subject.name) {
            id = pathName;
        }
    } else if (isTokenRoot) {
        id = `${token}#0`;
    } else {
        id = `${token}#${keccak256(pathName)}`;
    }

    // validate request
    const platform = platforms[platformName];
    const msg = JSON.stringify({
        type: request.type,
        subject: request.subject,
        email: request.email,
        imageHash: request.imageHash,
        dateRequested: request.dateRequested,
        data: request.data,
        contractNonce: request.contractNonce,
    });
    const reqMsg = `${msg}${SEPARATOR}${request.requestAddress}`;
    const actualReqAddr = platform.recoverAddress(
        request.requestSignature,
        reqMsg,
        !request.forSignature ? request.contractNonce : undefined,
    );
    const actualforAddr = request.forSignature
        ? platform.recoverAddress(
            request.forSignature,
            `${reqMsg}${SEPARATOR}${request.forAddress}`,
            request.contractNonce,
        )
        : undefined;
    if (request.requestAddress !== actualReqAddr) {
        throw new Error('Inconsistent requestor address.');
    }
    if (request.forAddress && request.forAddress !== actualforAddr) {
        throw new Error('Inconsistent for address.');
    }

    // build the certificate object.
    const certificate = await gzip(Buffer.from(JSON.stringify({
        id,
        ...request,
        type: request.type.replace('Request', 'Certificate'),
        issuer,
        issuerEmail: email,
        dateIssued: Math.floor(Date.now() / 1000),
        serialNumber: generateSerialNumber(),
    }), 'utf8'));

    // digitally sign the issued certificate.
    const signature = await platform.signMessage(key, keccak256(certificate, 'bytes'));

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
async function inspectCertificate(filepath) {
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
            certBytes,
            certificate: JSON.parse((await ungzip(certBytes)).toString('utf8')),
            signature: certData.signature,
        };
    } else {
        throw new Error(`Unknown certificate format '${certData.format}'.`);
    }

    const cert = result.certificate;
    const {
        type, subject, email, imageHash, dateRequested, data, contractNonce,
    } = cert;
    const { pathName, platformName } = extractPath(result.certificate.subject.name);
    const platform = platforms[platformName];
    const msg = JSON.stringify({
        type: type.replace('Certificate', 'Request'), subject, email, imageHash, dateRequested, data, contractNonce,
    });
    if (type === certTypeMapping.ca) {
        hash = sha256(dateRequested + subject.name);
    }
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
        keccak256(result.certBytes, 'bytes'),
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
        cert.requestSignatureAddress = requestSignatureAddress;
        cert.forSignatureAddress = forSignatureAddress;
    }

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

    // perform a schema validation of the certificate.
    const cert = data.certificate;
    const { platformName } = extractPath(cert.subject.name);
    const { addressesAreEqual } = platforms[platformName];
    const schema = certificateSchemaFactory(platformName);
    const { error } = schema.validate(cert);
    if (error) {
        return `Certificate${error}`;
    }

    if (data.imageHash !== cert.imageHash) {
        return 'The SHA-256 hash in the certificate does not match actual hash of the image.';
    }

    const reqNonce = !cert.forAddress ? cert.contractNonce : undefined;
    if (!addressesAreEqual(cert.requestSignatureAddress, cert.requestAddress, reqNonce)) {
        return 'The requestor signature is inconsistent.';
    }

    if (cert.forAddress
        && !addressesAreEqual(cert.forSignatureAddress, cert.forAddress, cert.contractNonce)) {
        return 'The for signature is inconsistent.';
    }

    if (cert.type === certTypeMapping.domain
        && !addressesAreEqual(cert.signatureAddress, data.signatureMarkAddress)) {
        return 'The requestor and image signature addresses do not match!';
    }

    if (cert.type === certTypeMapping.ca) {
    // CA certificates are always self-signed.
        if (cert.subject.name !== cert.issuer.name) {
            return 'The subject and issuer names do not match for the CA certificate.';
        }
        if (!addressesAreEqual(cert.signatureAddress, data.signatureAddress)) {
            return 'The requestor and issuer addresses do not match for the CA certificate.';
        }
    } else {
    // validate the issuer's path name.
        const {
            pathName: issuerPath,
            platformName: issuerPlatform,
        } = extractPath(data.certificate.issuer.name);
        const {
            pathName: subjectPath,
            platformName: subjectPlatform,
        } = extractPath(data.certificate.subject.name);

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
        if (!addressesAreEqual(data.signatureAddress, addr)) {
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
    if (data.certificate.type !== certTypeMapping.token) {
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
