
async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Displays or modifies stored trusts.');
    console.log('\nUsage:');
    console.log('     nftls trust <add-ca | remove-ca | refresh> (<root address>) (<forward address>)');
    console.log('        name: --name [-n] <trust name>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args._target}'.`);
    await helpCommand();
    process.exit(1);
}

async function addCATrustCli(args, rootAddress, forwardAddress) {
    const name = args.n || args.name;
    forwardAddress = forwardAddress || rootAddress;
    console.log(` ✓ Successfully added trust '${name}'.`);
}

async function removeCATrustCli(args, rootAddress, forwardAddress) {
    const name = args.n || args.name;
    forwardAddress = forwardAddress || rootAddress;
    console.log(` ✓ Successfully removed trust '${name}'.`);
}

async function listCATrustCli(args) {
}

async function syncTrustCli() {
}

module.exports = {
    defaultCommand,
    helpCommand,
    'add': addCATrustCli,
    'remove': removeCATrustCli,
    'list': listCATrustCli,
    'sync': syncTrustCli
}
