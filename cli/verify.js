const { inspectCertificate, verifyCertificate } = require('../src/certificate');

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Verifies the authenticity of a certificate or signed token.');
    console.log('\nUsage:');
    console.log('     nftls --verify <file> (<address>)');
    console.log('        verify chain: ( --chain)');
}

async function defaultCommand(args, address) {
    const filepath = args._target;
    const cert = await inspectCertificate(filepath);
    const result = await verifyCertificate(cert, address);
    console.log(` ${(result === 'Verified' ? '✓' : 'x')} ${result}`);
    if (result !== 'Verified') {
        return process.exit(1);
    }
    /*if (args.chain === true) {
        const chain = await downloadTokenChain(token.id);
        for (let link in chain) {
            const linkResult = await zones.verifyZone(link.token, link.address);
            if (linkResult !== 'Verified') {
                console.log(` x ${linkResult}`);
                return process.exit(1);
            }
        }
        if (token.signatureAddress != chain[0].address.toLowerCase()) {
            console.log(` x The signature address does not match the token chain address.`);
            return process.exit(1);
        }
    }*/
}

module.exports = {
    defaultCommand,
    helpCommand
};
