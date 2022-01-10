const { readLine } = require('../utils');

async function helpCommand() {
    console.log('\nDescription:');
    console.log('    Connects the lookup tool to a blockchain network in order to perform lookups.');
    console.log('\nUsage:');
    console.log('     nftls-lookup connect <platform> (<API key>)');
    console.log('        environment: --env <[mainnet] | kovan | goerli | rinkeby | ropsten>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args._target}'.`);
    await helpCommand();
    process.exit(1);
}

async function addConnectEthereumCli(args, apiKey) {
    if (!apiKey) {
        apiKey = await readLine('Enter an etherscan.io API Key: ', true);
    }
    console.log('Powered by Etherscan APIs');
}

module.exports = {
    defaultCommand,
    helpCommand,
    eth: addConnectEthereumCli
}
