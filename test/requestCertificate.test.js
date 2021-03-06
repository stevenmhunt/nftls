/* eslint-disable no-unused-expressions */
const assert = require('assert');
const _ = require('lodash');
const { expect } = require('chai');
const { requestCertificate } = require('../src/certificates');
const { csrTypeMapping } = require('../src/constants');
const { generateWallet, getContractAddress } = require('../src/platforms/eth');

const { address: validAddress1, privateKey: validKey1 } = generateWallet();
const {
    address: validAddress2, publicKey: validPublicKey2, privateKey: validKey2,
} = generateWallet();

const validRequestTypes = _.keys(csrTypeMapping);
const validNames = {
    ca: '@eth:local',
    domain: 'something.wallet@eth:local',
    address: `${validAddress1}@eth:local`,
    token: `${validAddress1}#5@eth:local`,
};
const validSubject = 'O=nftls.io, OU=QA Department, C=US, S=New York, L=Rochester';
const validEmail = 'test@nftls.io';
const validNonce = 5;
const validVersion = 5;

const invalidRequestTypes = ['other', undefined, 0, null, ''];
const invalidNames = {
    ca: ['whatever@eth:local', '*.*@eth:local', `${validAddress1}@eth:local`, `${validAddress1}#5@eth:local`],
    domain: ['@eth:local', '*.*@eth:local', `${validAddress1}@eth:local`, `${validAddress1}#5@eth:local`],
    address: ['@eth:local', 'whatever@eth:local', '*.*@eth:local', `${validAddress1}#5@eth:local`],
    token: ['@eth:local', 'whatever@eth:local', '*.*@eth:local', `${validAddress1}@eth:local`],
};
const invalidPlatformNames = {
    ca: '@blah',
    domain: '*@blah',
    address: `${validAddress1}@blah`,
    token: `${validAddress1}#5@blah`,
};
const invalidEmails = ['blah'];
const invalidNonces = [-5, 5.5, 'test'];
const invalidVersions = [-5, 5.5, 'test'];

describe('requestCertificate', () => {
    // valid CSR types:
    validRequestTypes.filter((i) => i !== 'ca').forEach((requestType) => {
        it(`should be able to create a CSR for a '${requestType}' certificate`, async () => {
            // arrange
            const subject = `CN=${validNames[requestType]}, ${validSubject}`;

            // act
            const result = await requestCertificate({
                requestType, subject, email: validEmail,
            }, { signingKey: validKey1 });

            // assert
            expect(result).is.not.null;
            expect(result.type).to.equal(csrTypeMapping[requestType], 'Unexpected CSR type.');
            expect(result.requestAddress).to.equal(validAddress1, 'Expected request address to match corresponding private key.');
            expect(result.subject.name).to.equal(validNames[requestType].toLowerCase());
        });
    });

    // valid CSRs with contract nonce:
    validRequestTypes.forEach((requestType) => {
        it(`should be able to create a CSR for a '${requestType}' certificate with a contract nonce`, async () => {
            // arrange
            const subject = `CN=${validNames[requestType]}, ${validSubject}`;

            // act
            const result = await requestCertificate({
                requestType, subject, email: validEmail, contractNonce: validNonce,
            }, { signingKey: validKey1 });

            // assert
            expect(result).is.not.null;
            expect(result.type).to.equal(csrTypeMapping[requestType], 'Unexpected CSR type.');
            expect(result.requestAddress).to.equal(validAddress1, 'Expected request address to match corresponding private key.');
            expect(result.forAddress).to.equal(getContractAddress(validAddress1, validNonce), 'Expected a valid contract address.');
            expect(result.subject.name).to.equal(validNames[requestType].toLowerCase());
        });
    });

    // valid CSRs with contract nonce AND for address:
    validRequestTypes.forEach((requestType) => {
        it(`should be able to create a CSR for a '${requestType}' certificate with a for address and contract nonce`, async () => {
            // arrange
            const subject = `CN=${validNames[requestType]}, ${validSubject}`;

            // act
            const result = await requestCertificate({
                requestType, subject, email: validEmail, contractNonce: validNonce,
            }, { signingKey: validKey1, forKey: validKey2 });

            // assert
            expect(result).is.not.null;
            expect(result.type).to.equal(csrTypeMapping[requestType], 'Unexpected CSR type.');
            expect(result.requestAddress).to.equal(validAddress1, 'Expected request address to match corresponding private key.');
            expect(result.forAddress).to.equal(getContractAddress(validAddress2, validNonce), 'Expected a valid contract address.');
            expect(result.subject.name).to.equal(validNames[requestType].toLowerCase());
        });
    });

    // valid CSRs with for address:
    validRequestTypes.filter((i) => i !== 'ca').forEach((requestType) => {
        it(`should be able to create a CSR for a '${requestType}' certificate with a for address`, async () => {
            // arrange
            const subject = `CN=${validNames[requestType]}, ${validSubject}`;

            // act
            const result = await requestCertificate({
                requestType, subject, email: validEmail,
            }, { signingKey: validKey1, forKey: validKey2 });

            // assert
            expect(result).is.not.null;
            expect(result.type).to.equal(csrTypeMapping[requestType], 'Unexpected CSR type.');
            expect(result.requestAddress).to.equal(validAddress1, 'Expected request address to match corresponding private key.');
            expect(result.forAddress).to.equal(validAddress2, 'Expected a valid contract address.');
            expect(result.subject.name).to.equal(validNames[requestType].toLowerCase());
        });
    });

    // valid CSRs with encrypt for:
    validRequestTypes.filter((i) => i !== 'ca').forEach((requestType) => {
        it(`should be able to create a CSR for a '${requestType}' certificate with an encrypt for public key`, async () => {
            // arrange
            const subject = `CN=${validNames[requestType]}, ${validSubject}`;

            // act
            const result = await requestCertificate({
                requestType, subject, email: validEmail,
            }, { signingKey: validKey1, encryptForKey: validPublicKey2 });

            // assert
            expect(result).is.not.null;
            expect(result.type).to.equal('encrypted');
            expect(result.platformName).to.equal('eth:local');
            expect(result.requestAddress).to.be.undefined;
            expect(result.forAddress).to.be.undefined;
            expect(result.subject).to.be.undefined;
        });
    });

    // valid version number (re-issue):
    validRequestTypes.filter((i) => i !== 'ca').forEach((requestType) => {
        it(`should be able to create a CSR for a new version of a '${requestType}' certificate`, async () => {
            // arrange
            const subject = `CN=${validNames[requestType]}, ${validSubject}`;

            // act
            const result = await requestCertificate({
                requestType, subject, email: validEmail, version: validVersion,
            }, { signingKey: validKey1 });

            // assert
            expect(result).is.not.null;
            expect(result.type).to.equal(csrTypeMapping[requestType], 'Unexpected CSR type.');
            expect(result.requestAddress).to.equal(validAddress1, 'Expected request address to match corresponding private key.');
            expect(result.subject.name).to.equal(validNames[requestType].toLowerCase());
            expect(result.version).to.equal(validVersion);
        });
    });

    // invalid contract nonce:
    invalidNonces.forEach((invalidNonce) => {
        validRequestTypes.forEach((requestType) => {
            it(`should not be able to create a CSR for a '${requestType}' certificate with an invalid contract nonce '${invalidNonce}'`, async () => {
                // arrange
                const subject = `CN=${validNames[requestType]}, ${validSubject}`;

                // act
                try {
                    await requestCertificate({
                        requestType, subject, email: validEmail, contractNonce: invalidNonce,
                    }, { signingKey: validKey1 });
                } catch (err) {
                    return;
                }

                // assert
                assert.fail('Expected an exception to be thrown.');
            });
        });
    });

    // invalid contract nonce:
    invalidVersions.forEach((invalidVersion) => {
        validRequestTypes.forEach((requestType) => {
            it(`should not be able to create a CSR for a '${requestType}' certificate with an invalid version '${invalidVersion}'`, async () => {
                // arrange
                const subject = `CN=${validNames[requestType]}, ${validSubject}`;

                // act
                try {
                    await requestCertificate({
                        requestType, subject, email: validEmail, version: invalidVersion,
                    }, { signingKey: validKey1 });
                } catch (err) {
                    return;
                }

                // assert
                assert.fail('Expected an exception to be thrown.');
            });
        });
    });

    // invalid subject names:
    validRequestTypes.forEach((requestType) => {
        invalidNames[requestType].forEach((name) => {
            it(`should not be able to create a CSR for a '${requestType}' certificate with subject name '${name}'`, async () => {
                // arrange
                const subject = `CN=${name}, ${validSubject}`;

                // act
                try {
                    await requestCertificate({
                        requestType, subject, email: validEmail,
                    }, { signingKey: validKey1 });
                } catch (err) {
                    return;
                }

                // assert
                assert.fail('Expected an exception to be thrown.');
            });
        });
    });

    // invalid subject names (platform):
    validRequestTypes.forEach((requestType) => {
        const name = invalidPlatformNames[requestType];
        it(`should not be able to create a CSR for a '${requestType}' certificate with invalid platform in the subject name '${name}'`, async () => {
            // arrange
            const subject = `CN=${name}, ${validSubject}`;

            // act
            try {
                await requestCertificate({
                    requestType, subject, email: validEmail,
                }, { signingKey: validKey1 });
            } catch (err) {
                return;
            }

            // assert
            assert.fail('Expected an exception to be thrown.');
        });
    });

    // invalid subject organization:
    validRequestTypes.forEach((requestType) => {
        it(`should not be able to create a CSR for a '${requestType}' certificate without a subject organization`, async () => {
            // arrange
            const subject = `CN=${validNames[requestType]}`;

            // act
            try {
                await requestCertificate({
                    requestType, subject, email: validEmail,
                }, { signingKey: validKey1 });
            } catch (err) {
                return;
            }

            // assert
            assert.fail('Expected an exception to be thrown.');
        });
    });

    // invalid email:
    invalidEmails.forEach((invalidEmail) => {
        validRequestTypes.forEach((requestType) => {
            it(`should not be able to create a CSR for a '${requestType}' certificate with an invalid email address '${invalidEmail}'`, async () => {
                // arrange
                const subject = `CN=${validNames[requestType]}, ${validSubject}`;

                // act
                try {
                    await requestCertificate({
                        requestType, subject, email: invalidEmail,
                    }, { signingKey: validKey1 });
                } catch (err) {
                    return;
                }

                // assert
                assert.fail('Expected an exception to be thrown.');
            });
        });
    });

    // Invalid CSR types:
    invalidRequestTypes.forEach((requestType) => {
        it(`should be not able to create a CSR for a '${requestType}' certificate`, async () => {
            // arrange
            const subject = `CN=${validNames[requestType]}, ${validSubject}`;

            // act
            try {
                await requestCertificate({
                    requestType, subject, email: validEmail,
                }, { signingKey: validKey1 });
            } catch (err) {
                return;
            }

            // assert
            assert.fail('Expected an exception to be thrown.');
        });
    });
});
