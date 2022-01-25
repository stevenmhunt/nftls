#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs-extra');
const { requestCertificate } = require('../../src/certificates');
const { generateWallet } = require('../../src/platforms/eth');

const { address: validAddress1, privateKey: validKey1 } = generateWallet();
const { privateKey: validKey2 } = generateWallet();

const validSubject = 'O=nftls.io, OU=QA Department, C=US, S=New York, L=Rochester';
const validEmail = 'test@nftls.io';
const validNonce = 0;

async function main() {
    const [
        caContract,
        caForContract,
        rootDomain,
        wildcardDomain,
        domain,
        address,
        token,
    ] = await Promise.all([
        requestCertificate({
            requestType: 'ca', subject: `CN=@eth, ${validSubject}`, email: validEmail, contractNonce: validNonce,
        }, { signingKey: validKey1 }),
        requestCertificate({
            requestType: 'ca', subject: `CN=@eth, ${validSubject}`, email: validEmail, contractNonce: validNonce,
        }, { signingKey: validKey1, forKey: validKey2 }),
        requestCertificate({ requestType: 'domain', subject: `CN=*@eth, ${validSubject}`, email: validEmail }, { signingKey: validKey1 }),
        requestCertificate({ requestType: 'domain', subject: `CN=*.tld@eth, ${validSubject}`, email: validEmail }, { signingKey: validKey1 }),
        requestCertificate({ requestType: 'domain', subject: `CN=name.tld@eth, ${validSubject}`, email: validEmail }, { signingKey: validKey1 }),
        requestCertificate({ requestType: 'address', subject: `CN=${validAddress1}@eth, ${validSubject}`, email: validEmail }, { signingKey: validKey1 }),
        requestCertificate({ requestType: 'token', subject: `CN=${validAddress1}#123@eth, ${validSubject}`, email: validEmail }, { signingKey: validKey1 }),
    ]);

    await fs.writeJSON('./validRequests.json', {
        caContract, caForContract, rootDomain, wildcardDomain, domain, address, token,
    }, { spaces: 4 });
}

main().catch((err) => console.error(err));
