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
    const format = args.f || args.format || 'json';
    const context = {};
    const cert = await inspectCertificateChain(context, args._target);
    if (format === 'json') {
        console.log(JSON.stringify(cert, null, 4));
    }
    if (format === 'compact-json') {
        console.log(JSON.stringify(cert));
    }
}

module.exports = {
    getHelpText,
    helpCommand,
    defaultCommand
};