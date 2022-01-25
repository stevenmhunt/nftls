const _ = require('lodash');
const platforms = require('./platforms');
const { platforms: platformSchemas } = require('./schemas/common');
const {
    csrTypeMapping, certTypeMapping, csrTypes, SEPARATOR,
} = require('./constants');
const csrSchemaFactory = require('./schemas/csrSchema');
const certificateSchemaFactory = require('./schemas/certificateSchema');
const { extractPath, calculateChainPaths } = require('./utils');

/**
 * @private
 * Validates a CSR object.
 * @param {object} request The CSR to validate.
 * @param {boolean} isSigned Whether or not the request has already been signed.
 */
function runCertificateRequestValidation(request, isSigned = true) {
    const {
        requestType, version, subject, email, code, contractNonce,
    } = request;

    // check arguments
    if (!isSigned) {
        if (!csrTypeMapping[requestType]) { throw new Error(`Invalid request type '${requestType}'.`); }
    } else if (csrTypes.indexOf(request.type) === -1) { throw new Error(`Invalid CSR type '${request.type}'.`); }
    if (!subject) { throw new Error('Subject information must be provided.'); }
    if (!subject.name) { throw new Error('A subject name must be provided.'); }
    if (!subject.organization) { throw new Error('A subject organization must be provided.'); }
    if (!subject.country) { throw new Error('A subject country must be provided.'); }
    if (!email) { throw new Error('An email address must be provided.'); }
    if (version !== undefined && (!Number.isInteger(version) || version < 0)) {
        throw new Error('A version must be a non-negative integer value.');
    }
    if (code !== undefined && (!Number.isInteger(code) || code < 0)) {
        throw new Error('A security code must be non-negative integer value.');
    }
    if (contractNonce !== undefined && (!Number.isInteger(contractNonce) || contractNonce < 0)) {
        throw new Error('A contract nonce must be non-negative integer value.');
    }

    // check platform and request type specific values.
    const { pathName, platformName } = extractPath(subject.name);
    const platform = platforms[platformName];
    if (!platform) { throw new Error(`Unsupported platform '${platformName}'.`); }
    const currentType = requestType || _.invert(csrTypeMapping)[request.type];
    if (currentType === 'ca' && pathName && pathName.length > 0) { throw new Error('CA certificates cannot have a non-zero length path.'); }
    if (currentType === 'ca' && version > 0) { throw new Error('CA certificates cannot be re-issued.'); }
    if (currentType === 'ca' && contractNonce === undefined) { throw new Error('CA certificates must specify a contract nonce to establish a token.'); }
    if (currentType !== 'ca') {
        const schema = platformSchemas[platformName][currentType];
        const { error } = schema().validate(pathName);
        if (error) { throw new Error(`CSR${error}`); }
    }
    // eslint-disable-next-line no-restricted-globals
    if (currentType === 'domain' && (pathName.length === 0 || !isNaN(pathName[0]))) {
        throw new Error('Invalid path name for a domain certificate.');
    }

    // if the request isn't signed yet, then validation is complete.
    if (!isSigned) { return; }

    // validate the schema
    const schema = csrSchemaFactory(platformName);
    const { error } = schema.validate(request);
    if (error) {
        throw new Error(`CSR${error}`);
    }

    // validate request signatures
    const msg = JSON.stringify({
        type: request.type,
        version: request.version,
        subject: request.subject,
        email: request.email,
        imageHash: request.imageHash,
        dateRequested: request.dateRequested,
        data: request.data,
        contractNonce: request.contractNonce,
    });
    const actualSigAddr = platform.recoverAddress(request.signature, `${code ? code + SEPARATOR : ''}${msg}`);
    const reqMsg = `${msg}${SEPARATOR}${request.requestAddress}`;
    const actualReqAddr = platform.recoverAddress(
        request.requestSignature,
        reqMsg,
    );
    const actualforAddr = request.forSignature
        ? platform.recoverAddress(
            request.forSignature,
            `${reqMsg}${SEPARATOR}${request.forAddress}`,
            request.contractNonce,
        )
        : undefined;
    if (actualSigAddr !== request.requestAddress) {
        throw new Error('Invalid signature.');
    }
    if (request.requestAddress !== actualReqAddr) {
        throw new Error('Inconsistent requestor address.');
    }
    if (request.forAddress && request.forAddress !== actualforAddr) {
        throw new Error('Inconsistent for address.');
    }
}

/**
 * @private
 * Validates a certificate object.
 * @param {object} certificate The certificate data to validate.
 * @param {object} data (optional) signature and calculated address data.
 * @param {string} addr (optional) expected signature address.
 */
function runCertificateValidation(certificate, data = null, addr = null) {
    const {
        type, dateRequested, id, subject, issuer, email,
    } = certificate;
    const currentType = _.invert(certTypeMapping)[type];
    const { platformName } = extractPath(subject.name);

    // check arguments
    if (!issuer) { throw new Error('Issuer information must be provided.'); }
    if (!issuer.name) { throw new Error('An issuer name must be provided.'); }
    if (!issuer.organization) { throw new Error('An issuer organization must be provided.'); }
    if (!email) { throw new Error('An email address must be provided.'); }
    if (dateRequested > Math.floor(Date.now() / 1000)) {
        throw new Error('Request date/time must be in the past.');
    }
    if (!subject || !subject.name) { throw new Error('A subject name is required.'); }
    if (!id && currentType === 'domain') { throw new Error('A token contract address must be provided for domain tokens.'); }

    // validate the underlying request.
    const keysToRemove = ['id', 'token', 'isTokenRoot', 'issuer', 'issuerEmail', 'dateIssued', 'serialNumber', 'signatureAddress', 'requestSignatureAddress', 'forSignatureAddress'];
    const request = _.pickBy(certificate, (v, k) => keysToRemove.indexOf(k) === -1);
    runCertificateRequestValidation({ ...request, type: request.type.replace('Certificate', 'Request') });

    // validate the certificate schema.
    const schema = certificateSchemaFactory(platformName);
    const { error: schemaError } = schema.validate(certificate);
    if (schemaError) {
        throw new Error(`Certificate${schemaError}`);
    }

    if (!data) { return; }
    const { addressesAreEqual } = platforms[platformName];

    if (data.imageHash && data.imageHash !== certificate.imageHash) {
        throw new Error('The hash in the certificate does not match actual hash of the image.');
    }

    if (certificate.requestSignatureAddress
        && !addressesAreEqual(
            certificate.requestSignatureAddress,
            certificate.requestAddress,
        )) {
        throw new Error('The requestor signature is inconsistent.');
    }

    if (certificate.forAddress
        && !addressesAreEqual(
            certificate.forSignatureAddress,
            certificate.forAddress,
            certificate.contractNonce,
        )) {
        throw new Error('The for signature is inconsistent.');
    }

    if (certificate.type === certTypeMapping.domain
        && data.signatureMarkAddress
        && !addressesAreEqual(certificate.signatureAddress, data.signatureMarkAddress)) {
        throw new Error('The requestor and image signature addresses do not match!');
    }

    if (certificate.type === certTypeMapping.ca) {
    // CA certificates are always self-signed.
        if (certificate.subject.name !== certificate.issuer.name) {
            throw new Error('The subject and issuer names do not match for the CA certificate.');
        }
        if (!addressesAreEqual(certificate.signatureAddress, data.signatureAddress)) {
            throw new Error('The requestor and issuer addresses do not match for the CA certificate.');
        }
    } else {
    // validate the issuer's path name.
        const {
            pathName: issuerPath,
            platformName: issuerPlatform,
        } = extractPath(certificate.issuer.name);
        const {
            pathName: subjectPath,
            platformName: subjectPlatform,
        } = extractPath(certificate.subject.name);

        const paths = calculateChainPaths(subjectPath);
        if (paths.indexOf(issuerPath) === -1) {
            throw new Error(`The issuer name '${issuerPath}@${issuerPlatform}' is not valid for issuing a certificate for '${certificate.subject.name}'.`);
        }

        // validate the issuer's blockchain platform.
        const compatiblePlatforms = platforms[subjectPlatform].getCompatiblePlatforms();
        if (subjectPlatform !== issuerPlatform
            && compatiblePlatforms.indexOf(issuerPlatform) === -1) {
            throw new Error(`The issuer platform '${issuerPlatform}' is not compatible with subject platform '${subjectPlatform}'.`);
        }
    }

    if (addr) {
        if (!addressesAreEqual(data.signatureAddress, addr)) {
            throw new Error('Invalid embedded signature address.');
        }
    }
}

module.exports = {
    runCertificateRequestValidation,
    runCertificateValidation,
};
