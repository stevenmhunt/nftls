/* eslint-disable no-console */
const fs = require('fs-extra');
const clc = require('cli-color');
const { installCertificate } = require('../../certificates');
const { displayStatus } = require('../utils');
const { extractPath } = require('../../utils');

function getHelpText() {
    return 'Installs the certificate into the target image.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls install <certificate file>');
    console.log('        target image:  --image <file>');
    console.log('        add to cache: (--cache)');
    console.log('        output file:  (--output [-o] <file>)');
}

async function defaultCommand(args) {
    const cert = await fs.readJSON(args.target);
    const { image } = args;
    const output = args.o || args.output || image;
    const cache = args.cache || false;

    // check required parameters.
    if (!image) {
        throw new Error('An image is required to embed a certificate.');
    }

    const { pathName, platformName } = extractPath(await installCertificate(cert, image, {
        output, cache,
    }));
    displayStatus(`Certificate for ${clc.magenta(platformName)} ${clc.yellow(pathName)} is installed and verified.`, null);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
};
