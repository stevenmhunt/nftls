/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
const _ = require('lodash');
const { getSessionContext } = require('../utils');

function getHelpText() {
    return 'Manages session configuration.';
}

async function helpCommand() {
    console.log('\nDescription:');
    console.log(`    ${getHelpText()}`);
    console.log('\nUsage:');
    console.log('     nftls-lookup config <get | set | get-all> <name> <value>');
}

async function defaultCommand(args) {
    console.log(`Error: Invalid command target '${args.target}'.`);
    await helpCommand();
    process.exit(1);
}

async function getConfigCli(args, key) {
    const context = await getSessionContext();
    console.log(await context.storage.getKeyItem('config', key));
}

async function getAllConfigCli() {
    const context = await getSessionContext();
    const items = await context.storage.getItems('config');
    console.log(_.keys(items).map((i) => ` ${i}: ${items[i]}`).join('\n'));
}

async function setConfigCli(args, key, value) {
    const context = await getSessionContext();
    if (value === 'true') {
        value = true;
    } else if (value === 'false') {
        value = false;
    } else if (value === 'null') {
        value = null;
    } else if (!NaN(value)) {
        value = parseFloat(value);
    }
    await context.storage.addKeyItem('config', key, value);
}

module.exports = {
    getHelpText,
    defaultCommand,
    helpCommand,
    get: getConfigCli,
    set: setConfigCli,
    'get-all': getAllConfigCli,
};
