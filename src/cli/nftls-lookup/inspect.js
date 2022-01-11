const _ = require('lodash');
const fs = require('fs-extra');
const { inspectCertificateChain } = require('../../certificateChains');

function getHelpText() {
    return 'Inspects the contents of a certificate chain.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup inspect <file>');
    console.log('        formatting option: ( --format [-f] <[text] | json | compact-json> )');
}

async function defaultCommand(args) {
    const format = args.f || args.format || 'text';
    const context = {};
    const chain = await inspectCertificateChain(context, args._target);
    if (format === 'text') {
        console.log('NFTLS Certificate Chain:')
        chain.forEach((cert) => {
            const type = `[${cert.certificate.type.split(' ')[1]}]`.padEnd(8);
            const name = cert.certificate.subject.name.padEnd(20);
            console.log(`    - ${type}  ${name}`);
            console.log(`        Address: ${cert.certificate.signatureAddress}${cert.certificate.forward ? ' -> ' + cert.certificate.forward : ''}`)
        });
    }
    if (format === 'json') {
        console.log(JSON.stringify(chain, null, 4));
    }
    if (format === 'compact-json') {
        console.log(JSON.stringify(chain));
    }
}

module.exports = {
    getHelpText,
    helpCommand,
    defaultCommand
};