/* eslint-disable no-console */
const fs = require('fs-extra');
const clc = require('cli-color');
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
    const cert = await fs.readJSON(args.target);
    const { image } = args;
    const output = args.o || args.output || image;

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to embed a certificate.');
    }

    const [path, platform] = (await installCertificate(cert, image, output)).split('@');
    displayStatus(`Certificate for ${clc.magenta(platform)} ${clc.yellow(path)} is installed and verified.`, null);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};
