const sigmark = require('eth-signature-mark');
const { inspectCertificate } = require('../certificates');

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Extracts a specific component from a certificate or signed token.');
    console.log('\nUsage:');
    console.log('     nftls extract <image-code | image-hash | requestor-signature | issuer-signature | image-signature | expected-hash> <file>');
    console.log('        formatting option: ( --format [-f] <[text] | json | compact-json> )');
    console.log('        image coordinates: ( --coordinates "<x>,<y>,<w>,<h>" )');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args._target}'.`);
    await helpCommand();
    process.exit(1);
}

async function extractSigmarkCli(args, filepath) {
    let result = null;
    if (args.coordinates !== undefined) {
        const coordinates = await processCoordinatesArg(args);
        result = await sigmark.extractSignatureMark(filepath, ...coordinates);
    }
    else {
        const data = await inspectCertificate(filepath);
        result = data.signatureMark;
    }
    console.log(result);
}

async function extractRequestorSigCli(args, filepath) {
    const data = await inspectCertificate(filepath);
    console.log(data.certificate.signature);
}

async function extractIssuerSigCli(args, filepath) {
    const data = await inspectCertificate(filepath);
    console.log(data.signature);
}

async function extractCodeCli(args, filepath) {
    const data = await inspectCertificate(filepath);
    console.log(data.code);
}

async function extractHashCli(args, filepath) {
    const data = await inspectCertificate(filepath);
    console.log(data.certificate.imageHash);
}

async function extractActualHashCli(args, filepath) {
    const data = await inspectCertificate(filepath);
    console.log(data.imageHash);
}

module.exports = {
    helpCommand,
    defaultCommand,
    'expected-hash': extractHashCli,
    'requestor-signature': extractRequestorSigCli,
    'issuer-signature': extractIssuerSigCli,
    'image-signature': extractSigmarkCli,
    'image-code': extractCodeCli,
    'image-hash': extractActualHashCli,
};
