/* eslint-disable no-console */

function getHelpText() {
    return 'Connect to a blockchain network in order to perform lookups.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup connect <platform> (options...)');
    console.log('        environment: --env <[mainnet] | kovan | goerli | rinkeby | ropsten>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

function addConnectEthereumCli() { }

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    eth: addConnectEthereumCli,
};
