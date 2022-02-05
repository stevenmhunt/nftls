/* eslint-disable no-console */
const { readLine, withOutput, stdinToString } = require('../utils');
const { authorizeCertificateToken } = require('../../certificateTokens');
const { PRIVATE_KEY_PROMPT, STDIO_ARG } = require('../../constants');

function getHelpText() {
    return 'Generates authorization signatures for minting and re-minting.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls authorize <certificate file> <signing key | [-]>');
    console.log('        output file:    (--output [-o] <file | [-]>)');
}

async function defaultCommand(args, signingKey) {
    const filepath = args.target;
    // check optional parameters.
    if (!signingKey) {
        // eslint-disable-next-line no-param-reassign
        signingKey = await readLine(PRIVATE_KEY_PROMPT, true);
    } else if (signingKey === STDIO_ARG) {
        // eslint-disable-next-line no-param-reassign
        signingKey = stdinToString();
    }

    return withOutput(await authorizeCertificateToken(filepath, signingKey), args);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};
