/* eslint-disable no-console */
const _ = require('lodash');
const fs = require('fs-extra');
const readline = require('readline');
const clc = require('cli-color');
const { Spinner } = require('cli-spinner');
const { parseX509Fields } = require('../utils');

async function readLine(prompt, isSecure) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.stdoutMuted = isSecure;

        rl.question(prompt, (password) => {
            rl.close();
            console.log();
            resolve(password);
        });

        // eslint-disable-next-line no-underscore-dangle
        rl._writeToOutput = function _writeToOutput(stringToWrite) {
            if (rl.stdoutMuted) {
                rl.output.write('');
            } else {
                rl.output.write(stringToWrite);
            }
        };
    });
}

function processCoordinatesArg(argv) {
    return (argv.coordinates || '6,6,6,6').split(',').filter((i) => i).map((i) => parseInt(i, 10));
}

async function processIdentityArg(data) {
    if (!_.isString(data)) {
        return data;
    }
    if (await fs.pathExists(data)) {
        return fs.readJSON(data);
    }
    return parseX509Fields(data);
}

function displayStatus(result, expected = 'Verified') {
    console.log(` ${(expected === null || result === expected ? clc.green('✓') : clc.red('✗'))} ${result}`);
}

async function withOutput(result, output) {
    if (output === 'stdout') {
        if (_.isBuffer(result)) { console.log(result.toString('base64')); } else if (_.isObject(result)) { console.log(JSON.stringify(result, null, 4)); } else { console.log(result); }
        return null;
    }
    if (output.endsWith('.json')) {
        return fs.writeFile(output, JSON.stringify((result), null, 4), { encoding: 'utf8' });
    }
    if (output.endsWith('.png')) {
        return fs.writeFile(output, result);
    }
    return fs.writeFile(output, result, 'utf8');
}

async function withProgress(fn, message) {
    const spinner = new Spinner({
        text: `%s ${message}`,
        stream: process.stderr,
        onTick: function onTick(msg) {
            this.clearLine(this.stream);
            this.stream.write(msg);
        },
    });
    spinner.setSpinnerString('|/-\\');
    spinner.start();
    const result = await fn();
    spinner.stop(true);
    return result;
}

module.exports = {
    readLine,
    processCoordinatesArg,
    processIdentityArg,
    displayStatus,
    withOutput,
    withProgress,
};
