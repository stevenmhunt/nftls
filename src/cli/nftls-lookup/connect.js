/* eslint-disable no-console */
const { readLine } = require('../utils');

function getHelpText() {
    return 'Connect to a blockchain network in order to perform lookups.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup connect <platform> (<API key>)');
    console.log('        environment: --env <[mainnet] | kovan | goerli | rinkeby | ropsten>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

async function addConnectEthereumCli(args, apiKey) {
    if (!apiKey) {
        // eslint-disable-next-line no-param-reassign
        apiKey = await readLine('Enter an etherscan.io API Key: ', true);
    }
    console.log('Powered by Etherscan APIs');
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    eth: addConnectEthereumCli,
};
