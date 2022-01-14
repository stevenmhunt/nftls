/* eslint-disable no-console */
const fs = require('fs-extra');
const { readLine, processIdentityArg, withOutput } = require('../utils');
const { issueCertificate } = require('../../certificates');
const { PRIVATE_KEY_PROMPT } = require('../../constants');

function getHelpText() {
    return 'Issues a new certificate using a certificate request.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls issue <certificate request file> (<signing key>)');
    console.log('        NFT identity:   (--id <NFT address>#<token number>)');
    console.log('        issuer data:    --issuer <x509 data | json file>');
    console.log('        email address:  --email <email address>');
    console.log('        output file:    --output [-o] <file | stdout>');
}

async function defaultCommand(args, key) {
    const request = await fs.readJSON(args.target);
    const { id } = args;
    const issuer = await processIdentityArg(args.issuer);
    const { email } = args;

    // check optional parameters.
    if (!key) {
        // eslint-disable-next-line no-param-reassign
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || 'stdout';

    return withOutput(await issueCertificate(request, {
        id, issuer, email,
    }, key), output);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};
