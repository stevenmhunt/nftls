/* eslint-disable no-console */
const { addCachedCertificate, removeCachedCertificate } = require('../../cachedCertificates');
const { readLine, displayStatus, getSessionContext } = require('../utils');

function getHelpText() {
    return 'Manages the local certificate cache.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup cache <add | remove> (<certificate>)');
    console.log('        no prompt: ( --force [-f] )');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

async function addCachedCertCli(args, filepath) {
    const context = await getSessionContext();
    const isForced = args.f === true || args.force === true;
    let result = await addCachedCertificate(context, filepath, isForced);
    if (!result && !isForced) {
        const prompt = await readLine('Warning: a certificate with this name already exists. Overwrite? (y/n) ');
        if (prompt.toLowerCase() === 'y') {
            result = await addCachedCertificate(context, filepath, true);
        } else {
            process.exit(1);
        }
    }

    if (result) {
        displayStatus(`Successfully added certificate '${result.split(';')[0]}' to the cache.`, true);
    } else { process.exit(1); }
}

async function removeCachedCertCli(args) {
    const name = args.n || args.name;
    await removeCachedCertificate(name);
    displayStatus(`Successfully removed certificate '${name}' to the cache.`, true);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    add: addCachedCertCli,
    remove: removeCachedCertCli,
};
