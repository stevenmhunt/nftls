const { readLineSecure, parseIdentity } = require('./utils');
const { requestDomainCertificate } = require('../src/request');

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

async function requestDomainCli(args, key) {
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
        key = await readLineSecure(PRIVATE_KEY_PROMPT);
    }

    const output = args.o || args.output || `${image.split('.').slice(0, -1).join('.')}.json`;

    return requestDomainCertificate({
        image, subject, email, code
    }, key, output);
}

module.exports = {
    domain: requestDomainCli
};
