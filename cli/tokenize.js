const { readLineSecure, parseIdentity } = require('./utils');
const { tokenizeDomainCertificate } = require('../src/request');

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

async function tokenizeDomainCli(args, key) {
    const image = args.image;
    const name = args.name;

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to request a certificate.');
    }

    // check optional parameters.
    if (!key) {
        key = await readLineSecure(PRIVATE_KEY_PROMPT);
    }

    const output = args.o || args.output || image;
    const { code } = await tokenizeDomainCertificate({ name, image }, key, output);
    console.log(code);
}

module.exports = {
    domain: tokenizeDomainCli
};
