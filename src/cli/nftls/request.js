/* eslint-disable no-console */
const {
    readLine, processIdentityArg, withOutput, stdinToString,
} = require('../utils');
const { requestCertificate } = require('../../certificates');
const { PRIVATE_KEY_PROMPT, STDIO_ARG } = require('../../constants');

function getHelpText() {
    return 'Generates a Certificate Signing Request.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls request <domain | address | token> (<signing key | [-]>)');
    console.log('        base image:        --image <file>');
    console.log('        subject data:      --subject <x509 data | json file>');
    console.log('        email address:     --email <email address>');
    console.log('        for address:      (--for <for key>)');
    console.log('        re-issue version: (--version <number>)');
    console.log('        contract nonce:   (--contract <nonce>)');
    console.log('        encrypt for RA:   (--encrypt-for <public key>)');
    console.log('        output file:       --output [-o] <file | [-]>');
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
        const contractNonce = args.contract !== undefined ? parseInt(args.contract || '0', 10) : undefined;
        const encryptForKey = args['encrypt-for'];
        let forKey = args.for;

        // check optional parameters.
        if (!signingKey) {
            // eslint-disable-next-line no-param-reassign
            signingKey = await readLine(PRIVATE_KEY_PROMPT, true);
        } else if (signingKey === STDIO_ARG) {
            // eslint-disable-next-line no-param-reassign
            signingKey = stdinToString();
        }
        if (requestType === 'token') {
            // eslint-disable-next-line no-param-reassign
            forKey = undefined;
        } else if (forKey === STDIO_ARG) {
            // eslint-disable-next-line no-param-reassign
            forKey = await readLine(PRIVATE_KEY_PROMPT, true);
        }

        return withOutput(await requestCertificate({
            requestType, version, image, subject, email, contractNonce,
        }, { signingKey, forKey, encryptForKey }), args);
    };
}

async function requestCACli(args, signingKey) {
    const requestType = 'ca';
    const forKey = args.for;
    const subject = await processIdentityArg(args.subject);
    const { email } = args;
    const contractNonce = args.contract !== undefined ? parseInt(args.contract || '0', 10) : undefined;
    const encryptForKey = args['encrypt-for'];

    // check optional parameters.
    if (!signingKey) {
        // eslint-disable-next-line no-param-reassign
        signingKey = await readLine(PRIVATE_KEY_PROMPT, true);
    } else if (signingKey === STDIO_ARG) {
        // eslint-disable-next-line no-param-reassign
        signingKey = stdinToString();
    }

    return withOutput(await requestCertificate({
        requestType, subject, email, contractNonce,
    }, { signingKey, forKey, encryptForKey }), args);
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
