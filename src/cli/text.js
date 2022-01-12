/* eslint-disable no-console */
const _ = require('lodash');
const { certTypes } = require('../constants');

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
    if (certificate.forwardAddress) {
        console.log(`    Forward: ${certificate.forwardAddress}`);
    }
    console.log('    Subject:');
    _.keys(certificate.subject).forEach((s) => {
        console.log(`        ${_.startCase(s)}: ${certificate.subject[s]}`);
    });
    console.log(`        Email: ${certificate.email}`);
    console.log(`        Date Requested: ${certificate.dateRequested}`);
    if (certificate.type !== certTypes.ca && imageHash) {
        console.log('    Issuer:');
        _.keys(certificate.issuer).forEach((s) => {
            console.log(`        ${_.startCase(s)}: ${certificate.issuer[s]}`);
        });
        console.log(`        Email: ${certificate.issuerEmail}`);
    }
    console.log(`        Date Issued: ${certificate.dateIssued}`);
    console.log('    SHA-256:');
    console.log(`        ${certificate.imageHash}`);
    console.log('    Requestor Signature:');
    console.log(`        ${certificate.signature}`);
    if (certificate.signatureAddress) {
        console.log(`        Address: ${certificate.signatureAddress}`);
    }
    if (imageHash) {
        console.log('    Issuer Signature:');
        console.log(`        ${signature}`);
        console.log(`        Address: ${signatureAddress}`);
        if (certificate.type !== certTypes.ca && imageHash) {
            console.log('    Image:');
            if (code) {
                console.log(`        Code: ${code}`);
            }
            console.log(`        SHA-256: ${imageHash}`);
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
