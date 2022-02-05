/* eslint-disable no-console */
const { downloadCertificate } = require('../../certificateChains');
const { withProgress, withOutput, getSessionContext } = require('../utils');

function getHelpText() {
    return 'Downloads a certificate from the target blockchain platform.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup download <FQDN or FQTN>');
    console.log('        enable caching:  ( --cache )');
    console.log('        disable caching: ( --no-cache )');
    console.log('        output file:     --output [-o] <file | [-]>');
}

async function defaultCommand(args) {
    const context = await getSessionContext();
    const cache = args.cache !== undefined ? args.cache : await context.storage.getKeyItem('config', 'useCache');
    return withOutput(await withProgress(
        () => downloadCertificate(context, args.target, { cache }),
        'Scanning the target blockchain platform...',
    ), args);
}

module.exports = {
    getHelpText,
    helpCommand,
    defaultCommand,
};
