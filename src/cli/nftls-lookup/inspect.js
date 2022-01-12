const { inspectCertificateChain } = require('../../certificateChains');
const { certTypes } = require('../../constants');

const CLI_SPACING = 5;

function getHelpText() {
    return 'Inspects the contents of a certificate chain.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup inspect <file>');
    console.log('        formatting option: ( --format [-f] <[text] | json | compact-json> )');
}

async function defaultCommand(args) {
    const format = args.f || args.format || 'text';
    const context = {
        eth: {
            locateCertificate: function (name, address) {
                return new Promise((resolve) => {
                    console.log(`Searching blockchain for certificate '${name}' @ ${address}...`);
                    setTimeout(resolve, 1000);
                    // TODO: actually implement this...
                });
            }
        }
    };
    const { chain, status } = await inspectCertificateChain(context, args._target);
    if (format === 'text') {
        console.log('NFTLS Certificate Chain:')
        console.log('│');
        chain.filter(i => i).forEach((cert, index) => {
            const isCA = cert.certificate.type === certTypes.ca;
            const subject = cert.certificate.subject;
            const location = [subject.city, subject.state, subject.province, subject.country].filter(i => i).join(', ');
            console.log(`${''.padEnd(index * CLI_SPACING, ' ')}└───[${index + 1}] ${isCA ? '(CA) ' : ''}${subject.name}`);
            console.log(`${''.padEnd((index + 1) * CLI_SPACING, ' ')}│   Subject: ${subject.organization} (${location})`);
            console.log(`${''.padEnd((index + 1) * CLI_SPACING, ' ')}│   Address: ${cert.certificate.signatureAddress}${cert.certificate.forward ? ' -> ' + cert.certificate.forward : ''}`);
            console.log(`${''.padEnd((index + 1) * CLI_SPACING, ' ')}│   Status: ${(cert.status === 'Verified' ? '✓' : '✗')} ${cert.status}`);
            console.log(`${''.padEnd((index + 1) * CLI_SPACING, ' ')}│`);
        });
        const padSize = chain.filter(i => i).length * CLI_SPACING;
        if (status === 'Incomplete') {
            console.log(`${''.padEnd(padSize, ' ')}=   ✗ Incomplete`);
        }
        else {
            console.log(`${''.padEnd(padSize, ' ')}└──[${chain.length + 1}] (Target Certificate)`);
            console.log(`${''.padEnd(padSize, ' ')}        Status: ✓ Complete`);
        }
    }
    if (format === 'json') {
        console.log(JSON.stringify({ status, chain }, null, 4));
    }
    if (format === 'compact-json') {
        console.log(JSON.stringify({ status, chain }));
    }
}

module.exports = {
    getHelpText,
    helpCommand,
    defaultCommand
};