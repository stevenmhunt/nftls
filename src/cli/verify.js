const { inspectCertificate, verifyCertificate } = require('../certificates');

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Verifies the authenticity of a certificate or signed token.');
    console.log('\nUsage:');
    console.log('     nftls --verify <file> (<expected parent address>)');
}

async function defaultCommand(args, address) {
    const filepath = args._target;
    const cert = await inspectCertificate(filepath);
    const result = await verifyCertificate(cert, address);
    console.log(` ${(result === 'Verified' ? '✓' : 'x')} ${result}`);
    if (result !== 'Verified') {
        return process.exit(1);
    }
}

module.exports = {
    defaultCommand,
    helpCommand
};
