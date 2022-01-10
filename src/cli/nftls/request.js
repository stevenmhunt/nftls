const { readLine, parseIdentity, withOutput } = require('../utils');
const { requestCertificate } = require('../../certificates');

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Generates a certificate request.');
    console.log('\nUsage:');
    console.log('     nftls request <domain | token> (<private key>) (<forward address>)');
    console.log('        base image:       --image <file>');
    console.log('        subject data:     --subject <x509 data | json file>');
    console.log('        email address:    --email <email address>');
    console.log('        certificate code: (--code <number>)');
    console.log('        output file:      --output [-o] <file | stdout>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args._target}'.`);
    await helpCommand();
    process.exit(1);
}

async function requestDomainCli(args, key, forward) {
    const requestType = 'domain';
    const image = args.image;
    const subject = await parseIdentity(args.subject);
    const email = args.email;
    const code = parseInt(args.code || '0', 10);

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to request a certificate.');
    }

    // check optional parameters.
    if (!key) {
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || `${image.split('.').slice(0, -1).join('.')}.json`;

    return withOutput(await requestCertificate({
        requestType, image, subject, email, code, forward
    }, key), output);
}

async function requestTokenCli(args, key) {
    const requestType = 'token';
    const image = args.image;
    const subject = await parseIdentity(args.subject);
    const email = args.email;

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to request a certificate.');
    }

    // check optional parameters.
    if (!key) {
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || `${image.split('.').slice(0, -1).join('.')}.json`;

    return withOutput(await requestCertificate({
        requestType, image, subject, email
    }, key), output);
}

module.exports = {
    defaultCommand,
    helpCommand,
    domain: requestDomainCli,
    token: requestTokenCli
};
