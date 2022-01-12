/* eslint-disable no-console */
const { readLine, processIdentityArg, withOutput } = require('../utils');
const { requestCertificate } = require('../../certificates');

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

function getHelpText() {
    return 'Generates a certificate request.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls request <domain | token> (<private key>) (<forward key>)');
    console.log('        base image:       --image <file>');
    console.log('        subject data:     --subject <x509 data | json file>');
    console.log('        email address:    --email <email address>');
    console.log('        certificate code: (--code <number>)');
    console.log('        output file:      --output [-o] <file | [stdout]>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

async function requestDomainCli(args, key, forwardKey) {
    const requestType = 'domain';
    const { image } = args;
    const subject = await processIdentityArg(args.subject);
    const { email } = args;
    const code = parseInt(args.code || '0', 10);

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to request a certificate.');
    }

    // check optional parameters.
    if (!key) {
        // eslint-disable-next-line no-param-reassign
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || 'stdout';

    return withOutput(await requestCertificate({
        requestType, image, subject, email, code,
    }, key, forwardKey), output);
}

async function requestTokenCli(args, key) {
    const requestType = 'token';
    const { image } = args;
    const subject = await processIdentityArg(args.subject);
    const { email } = args;

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to request a certificate.');
    }

    // check optional parameters.
    if (!key) {
        // eslint-disable-next-line no-param-reassign
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || 'stdout';

    return withOutput(await requestCertificate({
        requestType, image, subject, email,
    }, key), output);
}

async function requestCACli(args, key, forwardKey) {
    const requestType = 'ca';
    const subject = await processIdentityArg(args.subject);
    const { email } = args;

    // check optional parameters.
    if (!key) {
        // eslint-disable-next-line no-param-reassign
        key = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || 'stdout';

    return withOutput(await requestCertificate({
        requestType, subject, email,
    }, key, forwardKey), output);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    domain: requestDomainCli,
    token: requestTokenCli,
    ca: requestCACli,
};
