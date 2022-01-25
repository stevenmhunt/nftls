/* eslint-disable no-console */
const _ = require('lodash');
const { certTypeMapping } = require('../constants');

function displayCertificate({
    certificate, imageHash, signature, signatureAddress, code, signatureMark, signatureMarkAddress,
}, number = null) {
    if (number !== null && number >= 0) {
        process.stdout.write(` [${number + 1}] `);
    }
    console.log(`${certificate.type}:`);
    console.log(`    Serial Number: ${certificate.serialNumber}`);
    if (certificate.id) {
        console.log(`    Token Identifier: ${certificate.id}`);
    }
    if (certificate.forAddress) {
        // eslint-disable-next-line no-restricted-globals
        const forContract = !isNaN(certificate.contractNonce) ? '(Contract) ' : '';
        console.log(`    For: ${forContract}${certificate.forAddress}`);
    }
    console.log('    Subject:');
    _.keys(certificate.subject).forEach((s) => {
        console.log(`        ${_.startCase(s)}: ${certificate.subject[s]}`);
    });
    console.log(`        Email: ${certificate.email}`);
    console.log(`        Date Requested: ${new Date(certificate.dateRequested * 1000).toISOString()}`);
    if (certificate.type !== certTypeMapping.ca && imageHash) {
        console.log('    Issuer:');
        _.keys(certificate.issuer).forEach((s) => {
            console.log(`        ${_.startCase(s)}: ${certificate.issuer[s]}`);
        });
        console.log(`        Email: ${certificate.issuerEmail}`);
    }
    console.log(`        Date Issued: ${new Date(certificate.dateIssued * 1000).toISOString()}`);
    if (certificate.imageHash) {
        console.log('    Image Hash::');
        console.log(`        ${certificate.imageHash}`);
    }
    console.log('    Requestor Signature:');
    console.log(`        ${certificate.signature}`);
    if (certificate.signatureAddress) {
        console.log(`        Address: ${certificate.signatureAddress}`);
    }
    console.log('    Issuer Signature:');
    console.log(`        ${signature}`);
    console.log(`        Address: ${signatureAddress}`);
    if (imageHash) {
        if (certificate.type !== certTypeMapping.ca && imageHash) {
            console.log('    Image:');
            if (code) {
                console.log(`        Code: ${code}`);
            }
            console.log(`        Hash: ${imageHash}`);
            if (signatureMark) {
                console.log('        Signature:');
                console.log(`            ${signatureMark}`);
                console.log(`            Address: ${signatureMarkAddress}`);
            }
        }
    }
}

module.exports = {
    displayCertificate,
};
