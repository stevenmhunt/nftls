/* eslint-disable no-console */
const { downloadCertificate } = require('../../certificateChains');
const { withProgress, getSessionContext } = require('../utils');

function getHelpText() {
    return 'Resolves a certificate from the target blockchain platform.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup resolve <FQDN or FQTN>');
}

async function defaultCommand(args) {
    const context = await getSessionContext();
    const result = await withProgress(
        () => downloadCertificate(context, args.target),
        'Scanning the target blockchain platform...',
    );
    console.log(JSON.stringify(result));
}

module.exports = {
    getHelpText,
    helpCommand,
    defaultCommand,
};
