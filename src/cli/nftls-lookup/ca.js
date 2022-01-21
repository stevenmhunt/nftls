/* eslint-disable no-console */
const { addCertificateAuthority, getCertificateAuthorities, removeCertificateAuthority } = require('../../certificateAuthorities');
const { readLine, displayStatus } = require('../utils');

function getHelpText() {
    return 'Manages the Certificate Authority references used for lookups.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup ca <add | remove | list> (<root CA file>)');
    console.log('        name:      (--name [-n] <CA organization name>)');
    console.log('        no prompt: ( --force [-f] )');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

async function addRootCli(args, filepath) {
    const isForced = args.f === true || args.force === true;
    let result = await addCertificateAuthority(filepath, isForced);
    if (!result && !isForced) {
        const prompt = await readLine('Warning: a CA with this name already exists. Overwrite? (y/n) ');
        if (prompt.toLowerCase() === 'y') {
            result = await addCertificateAuthority(filepath, true);
        } else {
            process.exit(1);
        }
    }

    if (result) {
        displayStatus(`Successfully added certificate authority '${result}'.`, true);
    } else { process.exit(1); }
}

async function removeRootCli(args) {
    const name = args.n || args.name;
    await removeCertificateAuthority(name);
    displayStatus(`Successfully removed certificate authority '${name}'.`, true);
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
            if (ca.forAddress) {
                console.log(`        For: ${ca.forAddress}`);
            }
            console.log(`        Status: ${ca.status}`);
        });
        return;
    }
    if (format === 'json') {
        console.log(JSON.stringify(data, null, 4));
        return;
    }
    if (format === 'compact-json') {
        console.log(JSON.stringify(data));
    }
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    add: addRootCli,
    remove: removeRootCli,
    list: listRootCli,
};
