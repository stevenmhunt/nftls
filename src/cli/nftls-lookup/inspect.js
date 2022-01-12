/* eslint-disable no-console */
const clc = require('cli-color');
const { inspectCertificateChain } = require('../../certificateChains');
const { certTypes } = require('../../constants');
const { shortenPath } = require('../../utils');
const { displayCertificate } = require('../text');
const { displayStatus } = require('../utils');

function getHelpText() {
    return 'Inspects the contents of a certificate chain.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup inspect <file>');
    console.log('        formatting option: ( --format [-f] <[tree] | text | json | compact-json> )');
}

async function defaultCommand(args) {
    const format = args.f || args.format || 'tree';
    const context = {
        eth: {
            locateCertificate(name, address) {
                return new Promise((resolve) => {
                    console.log(`Searching blockchain for certificate '${name}' @ ${address}...`);
                    setTimeout(resolve, 1000);
                    // TODO: actually implement this...
                });
            },
        },
    };
    const { chain, status } = await inspectCertificateChain(context, args.target);
    if (format === 'tree') {
        console.log(`[${clc.greenBright('#')}] NFTLS Certificate Chain:`);
        process.stdout.write(' │   Status:');
        displayStatus(status, 'Complete'); console.log(' │');
        chain.filter((i) => i).forEach((cert, index) => {
            const isCA = cert.certificate.type === certTypes.ca;
            const { subject } = cert.certificate;
            const [path, platform] = subject.name.split('@');
            const platformDisplay = clc.magenta(`${platform}`);
            const location = clc.blackBright(`[ ${[subject.city, subject.state, subject.province, subject.country].filter((i) => i).join(', ')} ]`);
            console.log(`[${clc.greenBright(index + 1)}]─── ${platformDisplay} ${clc.yellow(isCA ? '(CA)' : path)}`);
            console.log(` │   Owner: ${clc.bold(subject.organization)} ${location}`);
            console.log(` │   Address: ${shortenPath(cert.certificate.signatureAddress)}${cert.certificate.forwardAddress ? clc.blueBright(' -> ') + shortenPath(cert.certificate.forwardAddress) : ''}`);
            process.stdout.write(' │   Status:');
            displayStatus(cert.status);
            console.log(' │');
        });
        if (status === 'Incomplete') {
            console.log(`[${clc.redBright('X')}]`);
        } else {
            console.log(`[${clc.greenBright(chain.length + 1)}]─── ${clc.yellow('(Target Certificate)')}`);
        }

        return;
    }
    if (format === 'text') {
        console.log('NFTLS Certificate Chain:');
        chain.filter((i) => i).forEach((cert, index) => {
            displayCertificate(cert, index);
        });
        return;
    }
    if (format === 'json') {
        console.log(JSON.stringify({ status, chain }, null, 4));
        return;
    }
    if (format === 'compact-json') {
        console.log(JSON.stringify({ status, chain }));
    }
}

module.exports = {
    getHelpText,
    helpCommand,
    defaultCommand,
};
