const { addCertificateAuthority, getCertificateAuthorities } = require('../../certificateAuthorities');
const { readLine, displayStatus } = require('../utils');

function getHelpText() {
    return 'Manages the Certificate Authority references used for lookups.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup ca <add | remove | list> (<root CA file>)');
    console.log('        name:      --name [-n] <CA name>');
    console.log('        no prompt: ( --force [-f] )');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args._target}'.`);
    await helpCommand();
    process.exit(1);
}

async function addRootCli(args, filepath) {
    const name = args.n || args.name;
    const isForced = args.f === true || args.force === true;
    let result = await addCertificateAuthority(name, filepath, isForced);
    if (!result && !isForced) {
        const prompt = await readLine('Warning: a CA with this name already exists. Overwrite? (y/n) ');
        if (prompt.toLowerCase() === 'y') {
            result = await addCertificateAuthority(name, filepath, true);
        }
        else {
            process.exit(1);
        }
    }

    if (result) {
        displayStatus(`Successfully added certificate authority '${name}'.`, null);
    }
    else { process.exit(1); }
}

async function removeRootCli(args, address, forward) {
    const name = args.n || args.name;
    displayStatus(`Successfully removed certificate authority '${name}'.`, null);
}

async function listRootCli(args) {
    const format = args.f || args.format || 'text';
    const data = await getCertificateAuthorities();
    if (format === 'text') {
        console.log('NFTLS Certificate Authorities:');
        data.forEach((ca) => {
            console.log(`\n    ${ca.name}:`);
            console.log(`        Platform: ${ca.platform}`);
            console.log(`        Address: ${ca.address}`);
            if (ca.forward) {
                console.log(`        Forward: ${ca.forward}`);
            }
            console.log(`        Status: ${ca.status}`);
        });
    }
    else if (format === 'json') {
        return console.log(JSON.stringify(data, null, 4));
    }
    else if (formamt === 'compact-json') {
        return console.log(JSON.stringify(data));
    }
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    'add': addRootCli,
    'remove': removeRootCli,
    'list': listRootCli
}
