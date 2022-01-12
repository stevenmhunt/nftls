const fs = require('fs-extra');
const { readLine, processIdentityArg, withOutput } = require('../utils');
const { issueCertificate } = require('../../certificates');

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

function getHelpText() {
    return 'Issues a new certificate using a certificate request.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls issue <certificate request file> (<private key>)');
    console.log('        NFT identity:   (--id <NFT address>#<token number>)');
    console.log('        issuer data:    --issuer <x509 data | json file>');
    console.log('        email address:  --email <email address>');
    console.log('        output file:    --output [-o] <file | stdout>');
}

async function defaultCommand(args, key) {
    const request = await fs.readJSON(args._target);
    const id = args.id;
    const issuer = await processIdentityArg(args.issuer);
    const email = args.email;

    // check optional parameters.
    if (!key) {
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || 'stdout';

    return withOutput(await issueCertificate(request, {
        id, issuer, email
    }, key), output);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand
};
