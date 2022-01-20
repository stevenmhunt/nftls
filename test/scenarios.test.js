/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const {
    requestCertificate, issueCertificate, inspectCertificate, verifyCertificate,
} = require('../src/certificates');
const { parseX509Fields } = require('../src/utils');
const { generateWallet } = require('../src/platforms/eth');

const NFTLS_TEST_SUBJECT = 'O=nftls.io, OU=QA Department, C=US, S=New York, L=Rochester';
const NFTLS_EMAIL = 'test@nftls.io';

describe('NFTLS', () => {
    describe('Scenarios', () => {
        it('should be able to establish a CA and root certificate', async () => {
            // arrange
            const contractNonce = 10;
            const { privateKey: caKey } = generateWallet();
            const { privateKey: rootKey } = generateWallet();
            const caSubject = parseX509Fields(`CN=@eth, ${NFTLS_TEST_SUBJECT}`);
            const rootSubject = parseX509Fields(`CN=*@eth, ${NFTLS_TEST_SUBJECT}`);

            // act
            const caRequest = await requestCertificate({
                requestType: 'ca', subject: caSubject, email: NFTLS_EMAIL, contractNonce,
            }, caKey, rootKey);

            const caCert = await issueCertificate(caRequest, {
                issuer: parseX509Fields(`CN=@eth, ${NFTLS_TEST_SUBJECT}`), email: NFTLS_EMAIL,
            }, caKey);

            const caCertData = await inspectCertificate(caCert);

            const rootRequest = await requestCertificate({
                requestType: 'domain', subject: rootSubject, email: NFTLS_EMAIL,
            }, rootKey);

            const rootCertificate = await issueCertificate(rootRequest, {
                token: caCertData.certificate.forAddress,
                isTokenRoot: true,
                issuer: parseX509Fields(`CN=@eth, ${NFTLS_TEST_SUBJECT}`),
                email: NFTLS_EMAIL,
            }, caKey);

            const result = await verifyCertificate(rootCertificate);
            expect(result).is.equal('Verified');
        });
    });
});
