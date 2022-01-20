/* eslint-disable no-console */
const { readLine, withOutput } = require('../utils');
const { authorizeCertificateToken } = require('../../certificateTokens');
const { PRIVATE_KEY_PROMPT } = require('../../constants');

function getHelpText() {
    return 'Generates authorization signatures.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls authorize <mint> <signing key> <certificate file>');
    console.log('        add to cache:   (--cache)');
    console.log('        output file:    (--output [-o] <file | [stdout]>)');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

async function authorizeMintCli(args, signingKey, filepath) {
    // check optional parameters.
    if (!signingKey) {
        // eslint-disable-next-line no-param-reassign
        signingKey = await readLine(PRIVATE_KEY_PROMPT, true);
    }
    const output = args.o || args.output || 'stdout';
    const cache = args.cache || false;

    return withOutput(await authorizeCertificateToken('mint', filepath, signingKey, { cache }), output);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    mint: authorizeMintCli,
};
