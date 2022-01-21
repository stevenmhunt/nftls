/* eslint-disable no-console */
const { validateCertificateChain } = require('../../certificateChains');
const { displayStatus } = require('../utils');

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
    const result = await validateCertificateChain(context, filepath);
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
