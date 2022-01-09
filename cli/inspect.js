const _ = require('lodash');
const fs = require('fs-extra');
const { readLineSecure, parseIdentity } = require('./utils');
const { inspectCertificate } = require('../src/certificate');

async function defaultCommand(args) {
    const format = args.f || args.format || 'text';
    const code = parseInt(args.code || '0', 10);
    const cert = await inspectCertificate(args._target, code);
    if (format === 'json') {
        console.log(JSON.stringify(cert, null, 4));
    }
    else if (format === 'text') {
        const { certificate, imageHash, signature, signatureAddress, code, signatureMark, signatureMarkAddress } = cert;
        console.log(`${certificate.type}:`);
        console.log(`    Identifier: ${certificate.id}`);
        console.log('    Subject:');
        _.keys(certificate.subject).forEach((s) => {
            console.log(`        ${_.startCase(s)}: ${certificate.subject[s]}`);
        });
        console.log(`        Email: ${certificate.email}`);
        console.log(`        Date Requested: ${certificate.dateRequested}`);
        console.log('    Issuer:');
        _.keys(certificate.issuer).forEach((s) => {
            console.log(`        ${_.startCase(s)}: ${certificate.subject[s]}`);
        });
        console.log(`        Email: ${certificate.issuerEmail}`);
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
            console.log('    Image:');
            console.log(`        Code: ${code}`);
            console.log(`        SHA-256: ${imageHash}`);
            console.log('        Signature:');
            console.log(`            ${signatureMark}`);
            console.log(`            Address: ${signatureMarkAddress}`);
        }
    }
}

module.exports = {
    defaultCommand
};
