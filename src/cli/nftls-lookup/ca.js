
async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Displays or modifies stored Certificate Authority references.');
    console.log('\nUsage:');
    console.log('     nftls-lookup ca <add | remove | list> (<root address>) (<forward address>)');
    console.log('        name: --name [-n] <trust name>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args._target}'.`);
    await helpCommand();
    process.exit(1);
}

async function addRootCli(args, rootAddress, forwardAddress) {
    const name = args.n || args.name;
    forwardAddress = forwardAddress || rootAddress;
    console.log(` ✓ Successfully added CA '${name}'.`);
}

async function removeRootCli(args, rootAddress, forwardAddress) {
    const name = args.n || args.name;
    forwardAddress = forwardAddress || rootAddress;
    console.log(` ✓ Successfully removed CA '${name}'.`);
}

async function listRootCli(args) {
}

module.exports = {
    defaultCommand,
    helpCommand,
    'add': addRootCli,
    'remove': removeRootCli,
    'list': listRootCli
}
