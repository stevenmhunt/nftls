const _ = require('lodash');
const fs = require('fs-extra');
const { inspectCertificate } = require('../certificates');

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Inspects the contents of a certificate or signed token.');
    console.log('\nUsage:');
    console.log('     nftls inspect <file>');
    console.log('        formatting option: ( --format [-f] <[text] | json | compact-json> )');
    console.log('        certificate code:  ( --code <number>)');
}

async function defaultCommand(args) {
    const format = args.f || args.format || 'text';
    const code = parseInt(args.code || '0', 10);
    const cert = await inspectCertificate(args._target, code);
    if (format === 'json') {
        console.log(JSON.stringify(cert, null, 4));
    }
    if (format === 'compact-json') {
        console.log(JSON.stringify(cert));
    }
    else if (format === 'text') {
        const { certificate, imageHash, signature, signatureAddress, code, signatureMark, signatureMarkAddress } = cert;
        console.log(`${certificate.type}:`);
        console.log(`    Serial Number: ${certificate.serialNumber}`);
        console.log(`    Token Identifier: ${certificate.id}`);
        if (certificate.forward) {
            console.log(`    Forward:   ${certificate.forward}`);
        }
        console.log('    Subject:');
        _.keys(certificate.subject).forEach((s) => {
            console.log(`        ${_.startCase(s)}: ${certificate.subject[s]}`);
        });
        console.log(`        Email: ${certificate.email}`);
        console.log(`        Date Requested: ${certificate.dateRequested}`);
        console.log('    Issuer:');
        _.keys(certificate.issuer).forEach((s) => {
            console.log(`        ${_.startCase(s)}: ${certificate.issuer[s]}`);
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
    helpCommand,
    defaultCommand
};
