#!/usr/bin/env node
const _ = require('lodash');
const argv = require('mri')(process.argv.slice(2));
const package = require('../package.json');
const cli = require('../src/cli');

async function main() {
    if (argv.h === true || argv.help === true) {
        console.log(`nftls@${package.version}`);
        console.log(package.description);
        return;
    }

    if (argv.h || argv.help) {
        const cmd = cli[argv.h || argv.help];
        if (cmd) {
            if (cmd.helpCommand) {
                cmd.helpCommand(argv, ...argv._);
            }
            else {
                console.log('No help information available.');
            }
        }
        else {
            throw new Error(`Invalid command target '${target}'.`);
        }
    }

    const command = argv._[0];
    const target = argv._[1];
    if (target && _.isString(target)) {
        argv._target = target;
        if (!cli[command]) {
            throw new Error(`Invalid command '${command}'.`);
        }
        const params = argv._.slice(2);
        if (cli[command][target]) {
            if (cli[command].beforeCommand) {
                await cli[command].beforeCommand(argv, ...params);
            }
            await cli[command][target](argv, ...params);
            return;
        }
        else {
            if (cli[command].defaultCommand) {
                await cli[command].defaultCommand(argv, ...params);
            }
            else {
                console.log(`Error: Invalid command target '${target}'.`);
                process.exit(1);
            }
        }
    }

    if (argv.v === true || argv.version === true) {
        console.log(package.version);
        return;
    }
}

main()
/*    .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    });*/