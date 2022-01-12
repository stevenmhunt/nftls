/* eslint-disable no-console */
const { verifyCertificateChain } = require('../../certificateChains');
const { displayStatus } = require('../utils');

function getHelpText() {
    return 'Verifies the authenticity of a certificate chain.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup verify <file>');
}

async function defaultCommand(args) {
    const filepath = args.target;
    const context = {
        eth: {
            locateCertificate(name, address) {
                return new Promise((resolve) => {
                    console.log(`Searching blockchain for certificate '${name}' @ ${address}...`);
                    setTimeout(resolve, 1000);
                    // TODO: actually implement this...
                });
            },
        },
    };
    const result = await verifyCertificateChain(context, filepath);
    displayStatus(result);
    if (result !== 'Verified') {
        process.exit(1);
    }
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};