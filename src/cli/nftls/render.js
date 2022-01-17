/* eslint-disable no-console */
const { readLine } = require('../utils');
const { renderCertificateToken } = require('../../certificateTokens');
const { PRIVATE_KEY_PROMPT } = require('../../constants');

function getHelpText() {
    return 'Renders the specified image types.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls render <domain-token | address-token> (<private key>)');
    console.log('        token name:  --name <path>@<platform>');
    console.log('        base image:  --image <file>');
    console.log('        output file: --output [-o] <file>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

async function renderTokenCli(args, signingKey) {
    const [type] = args.target.split('-');
    const { image } = args;
    const { name } = args;
    const noCode = args.code === false;

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to request a certificate.');
    }

    // check optional parameters.
    if (!signingKey) {
        // eslint-disable-next-line no-param-reassign
        signingKey = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const out = args.o || args.output || image;
    const { code } = await renderCertificateToken(type, { name, image, noCode }, signingKey, out);
    if (code) {
        console.log(code);
    }
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    'domain-token': renderTokenCli,
    'address-token': renderTokenCli,
};
