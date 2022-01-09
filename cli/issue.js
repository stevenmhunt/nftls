const fs = require('fs-extra');
const { readLineSecure, parseIdentity } = require('./utils');
const { issueCertificate } = require('../src/certificate');

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

async function defaultCommand(args, key) {
    const request = await fs.readJSON(args._target);
    const issuer = await parseIdentity(args.issuer);
    const email = args.email;

    // check optional parameters.
    if (!key) {
        key = await readLineSecure(PRIVATE_KEY_PROMPT);
    }

    const output = args.o || args.output || `${image.split('.').slice(0, -1).join('.')}.cert.json`;

    return issueCertificate(request, {
        issuer, email
    }, key, output);
}

module.exports = {
    defaultCommand
};
