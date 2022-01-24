/* eslint-disable no-console */
const { readLine, withOutput } = require('../utils');
const { authorizeCertificateToken } = require('../../certificateTokens');
const { PRIVATE_KEY_PROMPT } = require('../../constants');

function getHelpText() {
    return 'Generates authorization signatures for minting and re-minting.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls authorize <certificate file> <signing key>');
    console.log('        output file:    (--output [-o] <file | [stdout]>)');
}

async function defaultCommand(args, signingKey) {
    const filepath = args.target;
    // check optional parameters.
    if (!signingKey) {
        // eslint-disable-next-line no-param-reassign
        signingKey = await readLine(PRIVATE_KEY_PROMPT, true);
    }
    const output = args.o || args.output || 'stdout';

    return withOutput(await authorizeCertificateToken(filepath, signingKey), output);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};
