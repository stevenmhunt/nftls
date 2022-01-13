/* eslint-disable no-console */
const clc = require('cli-color');
const { inspectCertificateChain } = require('../../certificateChains');
const { certTypeMapping } = require('../../constants');
const { shortenPath, extractPath } = require('../../utils');
const { displayCertificate } = require('../text');
const { displayStatus, withProgress } = require('../utils');

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
            locateCertificate() {
                return new Promise((resolve) => {
                    setTimeout(resolve, 3000);
                    // TODO: actually implement this...
                });
            },
        },
    };
    const { chain, status } = await withProgress(
        () => inspectCertificateChain(context, args.target),
        'Scanning the blockhain (Powered by etherscan.io)',
    );
    if (format === 'tree') {
        console.log('NFTLS Certificate Chain:');
        process.stdout.write('     Status:');
        displayStatus(status, 'Complete');
        console.log();
        chain.filter((i) => i).forEach((cert, index) => {
            const isCA = cert.certificate.type === certTypeMapping.ca;
            const { subject } = cert.certificate;
            const { pathName, platformName } = extractPath(subject.name);
            const platformDisplay = clc.magenta(`${platformName}`);
            const [tokenAddress, tokenNumber] = (cert.certificate.id || '').split('#');
            const location = clc.blackBright(`[ ${[subject.city, subject.state, subject.province, subject.country].filter((i) => i).join(', ')} ]`);
            console.log(`${index === 0 ? '──' : '  '}[${clc.greenBright(index + 1)}]┄┄ ${platformDisplay} ${clc.yellow(isCA ? '(CA)' : pathName)}`);
            console.log(`   │   Subject: ${clc.bold(subject.organization)} ${location}`);
            console.log(`   │   Address: ${shortenPath(cert.certificate.signatureAddress)}${cert.certificate.forAddress ? clc.blueBright(` (${shortenPath(cert.certificate.forAddress)})`) : ''}`);
            if (cert.certificate.id) {
                console.log(`   │   TokenID: ${shortenPath(tokenAddress)} #${tokenNumber}`);
            }
            process.stdout.write('   │   Status:');
            displayStatus(cert.status);
            console.log('   │');
        });
        if (status === 'Incomplete') {
            console.log(`  [${clc.redBright('X')}]`);
        } else {
            console.log(`  [${clc.greenBright(chain.length + 1)}]┄┄ ${clc.yellow('(Target Certificate)')}`);
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
