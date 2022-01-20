/* eslint-disable no-unused-expressions */
const assert = require('assert');
const _ = require('lodash');
const { expect } = require('chai');
const { requestCertificate } = require('../src/certificates');
const { parseX509Fields } = require('../src/utils');
const { csrTypeMapping } = require('../src/constants');
const { generateWallet } = require('../src/platforms/eth');

const { address, privateKey } = generateWallet();
const NFTLS_TEST_SUBJECT = 'O=nftls.io, OU=QA Department, C=US, S=New York, L=Rochester';
const NFTLS_EMAIL = 'test@nftls.io';

const validRequestTypes = _.keys(csrTypeMapping);
const invalidRequestTypes = ['other', undefined, 0, null];

describe('Certificates', () => {
    describe('requestCertificate', () => {
        // valid CSR types:
        validRequestTypes.forEach((requestType) => {
            it(`should be able to create a CSR for a '${requestType}' certificate`, async () => {
                // arrange
                const subjectName = '@eth';
                const subject = parseX509Fields(`CN=${subjectName}, ${NFTLS_TEST_SUBJECT}`);
                const email = NFTLS_EMAIL;

                // act
                const result = await requestCertificate({
                    requestType, subject, email,
                }, privateKey);

                // assert
                expect(result).is.not.null;
                expect(result.type).to.equal(csrTypeMapping[requestType], 'Unexpected CSR type.');
                expect(result.requestAddress).to.equal(address, 'Expected request address to match corresponding private key.');
                expect(result.subject.name).to.equal(subjectName);
            });
        });

        // Invalid CSR types:
        invalidRequestTypes.forEach((requestType) => {
            it(`should be not able to create a CSR for a '${requestType}' certificate`, async () => {
                // arrange
                const subjectName = '@eth';
                const subject = parseX509Fields(`CN=${subjectName}, ${NFTLS_TEST_SUBJECT}`);
                const email = NFTLS_EMAIL;

                // act
                try {
                    await requestCertificate({ requestType, subject, email }, privateKey);
                } catch (err) {
                    return;
                }
                assert.fail('Expected an exception to be thrown.');
            });
        });
    });
});
