/* eslint-disable no-unused-expressions */
const assert = require('assert');
const _ = require('lodash');
const { expect } = require('chai');
const { issueCertificate } = require('../src/certificates');
const { generateWallet, recoverAddress, signMessage } = require('../src/platforms/eth');
const validRequests = require('./data/validRequests.json');

const validIssuer = 'CN=@eth:local, O=nftls.io, OU=QA Department, C=US, S=New York, L=Rochester';
const validEmail = 'test@nftls.io';
const validTokenContract = '0x69eE797592aF3B5B3a3aD49e0ddC222210dA0CBA';
const validTokenArgs = {
    rootDomain: validTokenContract,
    wildcardDomain: validTokenContract,
    domain: validTokenContract,
};

const { address: validAddress1, privateKey: validKey1 } = generateWallet();

function invalidCSRTestCase(title, fn, errorMessage) {
    _.keys(validRequests).forEach((requestName) => {
        it(`should not be able to issue a certificate for the certificate request '${requestName}' with invalid ${title}`, async () => {
            // arrange
            const request = await fn(_.cloneDeep(validRequests[requestName]));

            // act
            try {
                await issueCertificate(request, {
                    issuer: validIssuer,
                    email: validEmail,
                    token: validTokenArgs[requestName],
                    isTokenRoot: requestName === 'rootDomain',
                }, validKey1);
            } catch (err) {
                if (errorMessage) {
                    expect(err.message).to.equal(errorMessage);
                }
                return;
            }

            // assert
            assert.fail('Expected an exception to be thrown.');
        });
    });
}

function invalidParametersTestCase(title, fn, errorMessage) {
    _.keys(validRequests).forEach((requestName) => {
        it(`should not be able to issue a certificate for the certificate request '${requestName}' with invalid ${title}`, async () => {
            // arrange
            const request = validRequests[requestName];

            // act
            try {
                await issueCertificate(request, fn({
                    issuer: validIssuer,
                    email: validEmail,
                    token: validTokenArgs[requestName],
                    isTokenRoot: requestName === 'rootDomain',
                }), validKey1);
            } catch (err) {
                if (errorMessage) {
                    expect(err.message).to.equal(errorMessage);
                }
                return;
            }

            // assert
            assert.fail('Expected an exception to be thrown.');
        });
    });
}

describe('issueCertificate', () => {
    // issue valid certificates.
    _.keys(validRequests).forEach((requestName) => {
        it(`should be able to issue a certificate for the certificate request '${requestName}'`, async () => {
            // arrange
            const request = validRequests[requestName];

            // act
            const result = await issueCertificate(request, {
                issuer: validIssuer,
                email: validEmail,
                token: validTokenArgs[requestName],
                isTokenRoot: requestName === 'rootDomain',
            }, validKey1);

            // assert
            expect(result).is.not.null;
            expect(result.format).to.equal('gzip', 'Unexpected certificate format.');
            expect(result.certificate).is.not.null;
            expect(result.signature).is.not.null;
            expect(recoverAddress(result.signature, Buffer.from(result.certificate, 'base64')))
                .to.equal(validAddress1);
        });
    });

    // invalid subject name.
    invalidCSRTestCase('subject name', (request) => {
        const req = request;
        req.subject.name = undefined;
        return req;
    }, 'A subject name is required.');

    // invalid subject name.
    invalidCSRTestCase('characters in subject name', (request) => {
        const req = request;
        req.subject.name = '*.*@eth:local';
        return req;
    });

    // invalid subject org.
    invalidCSRTestCase('subject organization', (request) => {
        const req = request;
        req.subject.organization = undefined;
        return req;
    }, 'A subject organization must be provided.');

    // invalid subject country.
    invalidCSRTestCase('subject country', (request) => {
        const req = request;
        req.subject.country = undefined;
        return req;
    }, 'A subject country must be provided.');

    // invalid subject email.
    invalidCSRTestCase('subject email', (request) => {
        const req = request;
        req.email = undefined;
        return req;
    }, 'An email address must be provided.');

    // invalid signature.
    invalidCSRTestCase('signature', async (request) => {
        const req = request;
        req.signature = await signMessage(validKey1, 'invalid signature');
        return req;
    }, 'Invalid signature.');

    // invalid date requested.
    invalidCSRTestCase('date requested', (request) => {
        const req = request;
        req.dateRequested = Math.floor(Date.now() / 1000) + 1000;
        return req;
    }, 'Request date/time must be in the past.');

    // invalid request address.
    invalidCSRTestCase('request address', (request) => {
        const req = request;
        req.requestAddress = generateWallet().address;
        return req;
    }, 'Invalid signature.');

    invalidParametersTestCase('issuer', (data) => {
        const d = data;
        d.issuer = undefined;
        return d;
    }, 'Issuer information must be provided.');

    invalidParametersTestCase('issuer name', (data) => {
        const d = data;
        d.issuer = d.issuer.replace('CN=@eth:local, ', '');
        return d;
    }, 'An issuer name must be provided.');

    invalidParametersTestCase('issuer organization', (data) => {
        const d = data;
        d.issuer = d.issuer.replace('O=nftls.io, ', '');
        return d;
    }, 'An issuer organization must be provided.');

    invalidParametersTestCase('issuer country', (data) => {
        const d = data;
        d.issuer = d.issuer.replace('C=US, ', '');
        return d;
    }, 'CertificateValidationError: "issuer.country" is required');

    invalidParametersTestCase('issuer email', (data) => {
        const d = data;
        d.email = undefined;
        return d;
    }, 'CertificateValidationError: "issuerEmail" is required');

    invalidParametersTestCase('token', (data) => {
        const d = data;
        d.token = !d.token ? 'test' : undefined;
        return d;
    });
});
