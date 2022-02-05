/* eslint-disable no-console */
const _ = require('lodash');
const { getSessionContext } = require('../utils');
const { PLATFORMS_KEY } = require('../../constants');

function getHelpText() {
    return 'Manages available blockchain network in order to perform lookups.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup platform <add | remove | list | providers> (<blockchain>:<network> <provider> <options...>)');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

const ethPlatforms = ['eth', 'eth:goerli', 'eth:kovan', 'eth:rinkeby', 'eth:ropsten'];

async function addPlatformCli(args, platform, ...options) {
    const context = await getSessionContext();
    if (platform === 'eth:*') {
        await Promise.all(ethPlatforms.map(
            (p) => context.storage.addKeyItem(PLATFORMS_KEY, p, options),
        ));
    } else {
        await context.storage.addKeyItem(PLATFORMS_KEY, platform, options);
    }
}

async function removePlatformCli(args, platform) {
    const context = await getSessionContext();
    context.storage.removeKeyItem(PLATFORMS_KEY, platform);
}

async function listPlatformCli(args) {
    const context = await getSessionContext();
    const format = args.f || args.format || 'text';
    const data = await context.storage.getItems(PLATFORMS_KEY);
    if (format === 'text') {
        console.log(_.keys(data).map((item) => `${item} (${data[item].join(', ') || 'no configuration'})`).join('\n'));
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

async function providersPlatformCli() {
    const providers = [
        '',
        ' Platform   Name             Argument(s)',
        ' ---------------------------------------',
        '  eth:*      Alchemy          <api key>',
        '  eth:*      AlchemyWebSocket <api key>',
        '  eth        Cloudflare',
        '  eth:*      Etherscan        <api key>',
        '  eth:*      Infura           <api key>',
        '  eth:*      InfuraWebSocket  <api key>',
        '  eth:*      JsonRpc          <url>',
        '  eth:*      Nodesmith        <api key>',
        '  eth:*      Pocket           <api key>',
        '  eth:*      WebSocket        <url>',
        '  eth:*      (default)',
    ];
    console.log(providers.join('\n'));
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    add: addPlatformCli,
    remove: removePlatformCli,
    list: listPlatformCli,
    providers: providersPlatformCli,
};
