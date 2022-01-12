const fs = require('fs-extra');
const { installCertificate } = require('../../certificates');
const { displayStatus } = require('../utils');

function getHelpText() {
    return 'Installs the certificate into the target image.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls install <certificate file>');
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

    const result = await installCertificate(cert, image, output);
    displayStatus(`Certificate for ${result} is installed and verified.`, null);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand
};
