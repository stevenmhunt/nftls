/* eslint-disable no-console */
const { inspectCertificate } = require('../../certificates');
const { displayCertificate } = require('../text');

function getHelpText() {
    return 'Inspects the contents of a certificate or signed token.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls inspect <file>');
    console.log('        formatting option: ( --format [-f] <[text] | json | compact-json> )');
}

async function defaultCommand(args) {
    const format = args.f || args.format || 'text';
    const cert = await inspectCertificate(args.target);
    if (format === 'json') {
        console.log(JSON.stringify(cert, null, 4));
    }
    if (format === 'compact-json') {
        console.log(JSON.stringify(cert));
    } else if (format === 'text') {
        displayCertificate(cert);
    }
}

module.exports = {
    getHelpText,
    helpCommand,
    defaultCommand,
};
