/* eslint-disable no-console */
const { readLine, processIdentityArg, withOutput } = require('../utils');
const { requestCertificate } = require('../../certificates');
const { PRIVATE_KEY_PROMPT } = require('../../constants');

function getHelpText() {
    return 'Generates a Certificate Signing Request.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls request <domain | address | token> (<signing key>)');
    console.log('        base image:        --image <file>');
    console.log('        subject data:      --subject <x509 data | json file>');
    console.log('        email address:     --email <email address>');
    console.log('        for address:      (--for <for key>)');
    console.log('        security code:    (--code <number>)');
    console.log('        re-issue version: (--version <number>)');
    console.log('        contract nonce:   (--contract <nonce>)');
    console.log('        output file:       --output [-o] <file | [stdout]>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

function generateRequestCli(requestType) {
    return async (args, signingKey) => {
        const { image } = args;
        const subject = await processIdentityArg(args.subject);
        const { email } = args;
        const version = args.version !== undefined ? parseInt(args.version || '0', 10) : 0;
        const code = args.code !== undefined ? parseInt(args.code || '0', 10) : undefined;
        const contractNonce = args.contract !== undefined ? parseInt(args.contract || '0', 10) : undefined;
        let forKey = args.for;

        // check optional parameters.
        if (!signingKey || signingKey === 'stdin') {
            // eslint-disable-next-line no-param-reassign
            signingKey = await readLine(PRIVATE_KEY_PROMPT, true);
        }
        if (requestType === 'token') {
            // eslint-disable-next-line no-param-reassign
            forKey = undefined;
        } else if (forKey === 'stdin') {
            // eslint-disable-next-line no-param-reassign
            forKey = await readLine(PRIVATE_KEY_PROMPT, true);
        }

        const output = args.o || args.output || 'stdout';

        return withOutput(await requestCertificate({
            requestType, version, image, subject, email, code, contractNonce,
        }, signingKey, forKey), output);
    };
}

async function requestCACli(args, signingKey) {
    const requestType = 'ca';
    const forKey = args.for;
    const subject = await processIdentityArg(args.subject);
    const { email } = args;
    const contractNonce = args.contract !== undefined ? parseInt(args.contract || '0', 10) : undefined;

    // check optional parameters.
    if (!signingKey) {
        // eslint-disable-next-line no-param-reassign
        signingKey = await readLine(PRIVATE_KEY_PROMPT, true);
    }

    const output = args.o || args.output || 'stdout';

    return withOutput(await requestCertificate({
        requestType, subject, email, contractNonce,
    }, signingKey, forKey), output);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    ca: requestCACli,
    domain: generateRequestCli('domain'),
    address: generateRequestCli('address'),
    token: generateRequestCli('token'),
};
