/* eslint-disable no-console */
const clc = require('cli-color');
const { inspectCertificateChain } = require('../../certificateChains');
const { certTypeMapping } = require('../../constants');
const { shortenPath, extractPath } = require('../../utils');
const { displayCertificate } = require('../text');
const { displayStatus, withProgress, getSessionContext } = require('../utils');

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
    const context = await getSessionContext();
    const { chain, status } = await withProgress(
        () => inspectCertificateChain(context, args.target),
        'Scanning the target blockchain platform...',
    );
    if (format === 'tree') {
        console.log('┌ NFTLS Certificate Chain:');
        process.stdout.write('│    Status:');
        displayStatus(status, status === 'Complete');
        console.log('│');
        chain.filter((i) => i).forEach((cert, index) => {
            const isCA = cert.certificate.type === certTypeMapping.ca;
            const { subject } = cert.certificate;
            const { pathName, platformName } = extractPath(subject.name);
            const platformDisplay = clc.magenta(`${platformName}`);
            const [tokenAddress, tokenNumber] = (cert.certificate.id || '').split('#');
            const division = subject.division ? ` / ${subject.division}` : '';
            const location = clc.blackBright(`[ ${[subject.city, subject.state, subject.province, subject.country].filter((i) => i).join(', ')} ]`);
            console.log(`${index === 0 ? '└─' : '  '}[${clc.greenBright(index + 1)}]┄┄ ${platformDisplay} ${clc.yellow(isCA ? '(CA)' : pathName)}`);
            console.log(`   │   Subject: ${clc.bold(subject.organization)}${division} ${location}`);
            console.log(`   │   Address: ${shortenPath(cert.certificate.requestAddress)}${cert.certificate.forAddress ? clc.blueBright(` (${shortenPath(cert.certificate.forAddress)})`) : ''}`);
            if (cert.certificate.id) {
                console.log(`   │   TokenID: ${shortenPath(tokenAddress)} #${shortenPath(tokenNumber)}`);
            }
            process.stdout.write('   │   Status:');
            displayStatus(cert.status, cert.status === 'Valid');
            console.log('   │');
        });
        if (status === 'Incomplete') {
            console.log(`  [${clc.redBright('X')}]`);
        } else {
            console.log(`  [${clc.greenBright(chain.length + 1)}]┄┄ ${clc.yellow('(Target Certificate)')}`);
        }
        process.exit(0);
    }
    if (format === 'text') {
        console.log('NFTLS Certificate Chain:');
        chain.filter((i) => i).forEach((cert, index) => {
            displayCertificate(cert, index);
        });
        process.exit(0);
    }
    if (format === 'json') {
        console.log(JSON.stringify({ status, chain }, null, 4));
        process.exit(0);
    }
    if (format === 'compact-json') {
        console.log(JSON.stringify({ status, chain }));
        process.exit(0);
    }
}

module.exports = {
    getHelpText,
    helpCommand,
    defaultCommand,
};
