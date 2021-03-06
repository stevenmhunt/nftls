/* eslint-disable no-console */
const { inspectCertificate } = require('../../certificates');

function getHelpText() {
    return 'Recovers address information from embedded signatures.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls recover <requestor-address | issuer-address | image-address> <file>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

async function recoverRequestorCli(args, filepath) {
    const data = await inspectCertificate(filepath);
    console.log(data.certificate.signatureAddress);
}

async function recoverIssuerCli(args, filepath) {
    const data = await inspectCertificate(filepath);
    console.log(data.signatureAddress);
}

async function recoverMarkCli(args, filepath) {
    const data = await inspectCertificate(filepath);
    console.log(data.signatureMarkAddress);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    'requestor-address': recoverRequestorCli,
    'issuer-address': recoverIssuerCli,
    'image-address': recoverMarkCli,
};
