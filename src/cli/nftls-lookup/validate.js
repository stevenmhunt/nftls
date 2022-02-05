/* eslint-disable no-console */
const { validateCertificateChain } = require('../../certificateChains');
const { displayStatus, getSessionContext } = require('../utils');

function getHelpText() {
    return 'Verifies the authenticity of a certificate chain.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup validate <file>');
}

async function defaultCommand(args) {
    const filepath = args.target;
    const context = await getSessionContext();
    const result = await validateCertificateChain(context, filepath);
    displayStatus(result);
    if (result.error) {
        process.exit(1);
    }
    process.exit(0);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};
