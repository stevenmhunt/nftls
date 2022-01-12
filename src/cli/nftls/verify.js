const { inspectCertificate, verifyCertificate } = require('../../certificates');
const { displayVerifyResult } = require('../utils');

function getHelpText() {
    return 'Verifies the authenticity of a certificate or signed token.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls verify <file> (<expected parent address>)');
}

async function defaultCommand(args, address) {
    const filepath = args._target;
    const cert = await inspectCertificate(filepath);
    const result = await verifyCertificate(cert, address);
    displayVerifyResult(result);
    if (result !== 'Verified') {
        return process.exit(1);
    }
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand
};
