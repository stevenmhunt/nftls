/* eslint-disable no-console */
const fs = require('fs-extra');
const {
    readLine, processIdentityArg, withOutput, stdinToString,
} = require('../utils');
const { issueCertificate } = require('../../certificates');
const { PRIVATE_KEY_PROMPT, STDIO_ARG } = require('../../constants');

function getHelpText() {
    return 'Issues a new certificate using a certificate request.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls issue <certificate request file> (<signing key | [-]>)');
    console.log('        NFT address:   (--token <contract address>)');
    console.log('        Is root token: (--token-root)');
    console.log('        issuer data:    --issuer <x509 data | json file>');
    console.log('        email address:  --email <email address>');
    console.log('        output file:    --output [-o] <file | [-]>');
}

async function defaultCommand(args, key) {
    const request = await fs.readJSON(args.target);
    const { token } = args;
    const isTokenRoot = args['token-root'] === true;
    const issuer = await processIdentityArg(args.issuer);
    const { email } = args;

    // check optional parameters.
    if (!key) {
        // eslint-disable-next-line no-param-reassign
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    } else if (key === STDIO_ARG) {
        // eslint-disable-next-line no-param-reassign
        key = stdinToString();
    }

    const output = args.o || args.output || STDIO_ARG;

    return withOutput(await issueCertificate(request, {
        token, isTokenRoot, issuer, email,
    }, key), output);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};
