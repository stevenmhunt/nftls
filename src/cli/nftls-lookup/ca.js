const { addCertificateAuthority, getCertificateAuthorities } = require('../../certificateAuthorities');

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Displays or modifies stored Certificate Authority references.');
    console.log('\nUsage:');
    console.log('     nftls-lookup ca <add | remove | list> (<root CA file>)');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args._target}'.`);
    await helpCommand();
    process.exit(1);
}

async function addRootCli(args, filepath) {
    const name = args.n || args.name;
    await addCertificateAuthority(name, filepath);
    console.log(` ✓ Successfully added CA '${name}'.`);
}

async function removeRootCli(args, rootAddress, forwardAddress) {
    const name = args.n || args.name;
    console.log(` ✓ Successfully removed CA '${name}'.`);
}

async function listRootCli() {
    console.log(await getCertificateAuthorities());
}

module.exports = {
    defaultCommand,
    helpCommand,
    'add': addRootCli,
    'remove': removeRootCli,
    'list': listRootCli
}
