/* eslint-disable no-console */
const _ = require('lodash');
const argv = require('mri')(process.argv.slice(2));
const pkg = require('../../package.json');

/**
 * Initiates a command-line application using the given CLI configuration.
 * @param {object} input The input data.
 * @param {string} input.app The application name.
 * @param {object} input.cli The CLI configuration object.
 * @returns {Promise}
 */
async function main({ app, cli }) {
    const command = argv._[0];
    const target = argv._[1];

    // <app> -v
    // <app> --version
    if (argv.v === true || argv.version === true) {
        console.log(pkg.version);
        return;
    }

    // <app> -h <item>
    // <app> --help <item>
    if (_.isString(argv.h) || _.isString(argv.help)) {
        const cmd = cli[argv.h || argv.help];
        if (cmd) {
            if (cmd.helpCommand) {
                cmd.helpCommand(argv, ...argv._);
            } else {
                console.log('No help information available.');
            }
            return;
        }
        throw new Error(`Invalid command target '${target}'.`);
    }

    // <app>
    // <app> -h
    // <app> --help
    if (argv.h === true || argv.help === true || !command) {
        console.log(`${app} ${pkg.version}`);
        console.log(pkg.description);
        if (app === 'nftls-lookup') {
            console.log('Powered by Etherscan.io APIs.');
        }
        console.log(`\nUsage:\n    ${app} <command> ...<args>`);
        console.log('\nCommands:');
        console.log(_.keys(cli).sort().map((k) => `    ${k.padEnd(20, ' ')}${cli[k].getHelpText()}`).join('\n'));
        console.log(`\nFor help on a specific command, use \`${app} --help <command>\`.`);
        return;
    }

    // <app> <command> <target>
    if (target && _.isString(target)) {
        argv.target = target;
        if (!cli[command]) {
            throw new Error(`Invalid command '${command}'.`);
        }
        const params = argv._.slice(2);
        if (cli[command][target]) {
            if (cli[command].beforeCommand) {
                await cli[command].beforeCommand(argv, ...params);
            }
            await cli[command][target](argv, ...params);
        } else if (cli[command].defaultCommand) {
            await cli[command].defaultCommand(argv, ...params);
        } else {
            console.log(`Error: Invalid command target '${target}'.`);
            process.exit(1);
        }
    }
}

module.exports = { main };
