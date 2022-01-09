const fs = require('fs-extra');
const { readLineSecure, parseIdentity } = require('./utils');
const { renderCertificate } = require('../src/certificate');

const PRIVATE_KEY_PROMPT = '<<<====DANGER====>>>\nPrivate Key: ';

async function defaultCommand(args) {
    const cert = await fs.readJSON(args._target);
    const image = args.image;

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to render a certificate.');
    }

    const output = args.o || args.output || image;

    return renderCertificate(cert, image, output);
}

module.exports = {
    defaultCommand
};
