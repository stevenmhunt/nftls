const fs = require('fs-extra');
const { readLine, parseIdentity, withOutput } = require('./utils');
const { issueCertificate } = require('../certificates');

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Issues a new certificate using a certificate request.');
    console.log('\nUsage:');
    console.log('     nftls --issue <certificate request file> (<private key>)');
    console.log('        issuer data:    --issuer <x509 data | json file>');
    console.log('        email address:  --email <email address>');
    console.log('        output file:    --output [-o] <file | stdout>');
}

async function defaultCommand(args, key) {
    const request = await fs.readJSON(args._target);
    const issuer = await parseIdentity(args.issuer);
    const email = args.email;

    // check optional parameters.
    if (!key) {
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || `${image.split('.').slice(0, -1).join('.')}.cert.json`;

    return withOutput(await issueCertificate(request, {
        issuer, email
    }, key), output);
}

module.exports = {
    defaultCommand,
    helpCommand
};
