const fs = require('fs-extra');
const { installCertificate } = require('../certificates');

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Installs the certificate into the target image.');
    console.log('\nUsage:');
    console.log('     nftls --install <certificate file>');
    console.log('        target image: --image <file>');
    console.log('        output file:  (--output [-o] <file>)');
}

async function defaultCommand(args) {
    const cert = await fs.readJSON(args._target);
    const image = args.image;
    const output = args.o || args.output || image;

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to embed a certificate.');
    }

    return installCertificate(cert, image, output);
}

module.exports = {
    defaultCommand,
    helpCommand
};
