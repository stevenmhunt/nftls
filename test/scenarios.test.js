/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const {
    requestCertificate, issueCertificate, inspectCertificate, validateCertificate,
} = require('../src/certificates');
const {
    authorizeCertificateToken,
} = require('../src/certificateTokens');
const { parseX509Fields, keccak256 } = require('../src/utils');
const { generateWallet } = require('../src/platforms/eth');

const NFTLS_SUBJECT = 'O=nftls.io, OU=QA Department, C=US, S=New York, L=Rochester';
const NFTLS_EMAIL = 'test@nftls.io';

describe('Scenarios', () => {
    it('should be able to establish a CA and root certificate', async () => {
        // arrange
        const contractNonce = 10;
        const { privateKey: caKey } = generateWallet();
        const { address: rootAddress, privateKey: rootKey } = generateWallet();
        const caSubject = parseX509Fields(`CN=@eth, ${NFTLS_SUBJECT}`);
        const rootPath = '*';
        const rootSubject = parseX509Fields(`CN=${rootPath}@eth, ${NFTLS_SUBJECT}`);

        // act
        const caRequest = await requestCertificate({
            requestType: 'ca', subject: caSubject, email: NFTLS_EMAIL, contractNonce,
        }, { signingKey: caKey, forKey: rootKey });

        const caCertificate = await issueCertificate(caRequest, {
            issuer: parseX509Fields(`CN=@eth, ${NFTLS_SUBJECT}`), email: NFTLS_EMAIL,
        }, caKey);

        const caCertData = await inspectCertificate(caCertificate);

        const rootRequest = await requestCertificate({
            requestType: 'domain', subject: rootSubject, email: NFTLS_EMAIL,
        }, { signingKey: rootKey });

        const rootCertificate = await issueCertificate(rootRequest, {
            token: caCertData.certificate.forAddress,
            isTokenRoot: true,
            issuer: parseX509Fields(`CN=@eth, ${NFTLS_SUBJECT}`),
            email: NFTLS_EMAIL,
        }, caKey);

        const authorization = await authorizeCertificateToken(rootCertificate, caKey);

        // assert
        const rootCertBytes = Buffer.from(rootCertificate.certificate, 'base64');
        expect((await validateCertificate(caCertificate)).error).is.undefined;
        expect((await validateCertificate(rootCertificate)).error).is.undefined;
        expect(authorization.recipient).is.equal(rootAddress);
        expect(authorization.path).is.equal(keccak256(rootPath));
        expect(authorization.hash).is.equal(keccak256(rootCertBytes));
    });
});
