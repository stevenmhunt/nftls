/* eslint-disable no-console */
const _ = require('lodash');
const fs = require('fs-extra');
const readline = require('readline');
const clc = require('cli-color');

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

const x509Mapping = {
    CN: 'name',
    O: 'organization',
    OU: 'division',
    C: 'country',
    S: 'state',
    P: 'province',
    L: 'city',
};

async function processIdentityArg(data) {
    if (!_.isString(data)) {
        return data;
    }
    if (await fs.pathExists(data)) {
        return fs.readJSON(data);
    }
    const result = {};
    data.split(',').map((i) => i.trim().split('=').map((j) => j.trim())).forEach((field) => {
        const [key, value] = field;
        result[x509Mapping[key] || key] = value;
    });
    return result;
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

module.exports = {
    readLine,
    processCoordinatesArg,
    processIdentityArg,
    displayStatus,
    withOutput,
};
