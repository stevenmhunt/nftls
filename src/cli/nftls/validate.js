/* eslint-disable no-console */
const { inspectCertificate, validateCertificate } = require('../../certificates');
const { displayStatus } = require('../utils');

function getHelpText() {
    return 'Verifies the authenticity of a certificate or signed token.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls validate <file> (<expected parent address>)');
}

async function defaultCommand(args, address) {
    const filepath = args.target;
    const cert = await inspectCertificate(filepath);
    const result = await validateCertificate(cert, address);
    displayStatus(result);
    if (result.error) {
        process.exit(1);
    }
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};
