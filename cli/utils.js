const { EOL } = require('os');
const _ = require('lodash');
const fs = require('fs-extra');
const readline = require('readline');

async function readLineSecure(prompt) {
    return new Promise((resolve) => {
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.stdoutMuted = true;
        
        rl.question(prompt, function(password) {
            rl.close();
            console.log();
            resolve(password);
        });
        
        rl._writeToOutput = function _writeToOutput(stringToWrite) {
            if (rl.stdoutMuted)
            rl.output.write('');
            else
            rl.output.write(stringToWrite);
        };      
    });
}

function processCoordinatesArg(argv) {
    return (argv.coordinates || '6,6,6,6').split(',').filter(i => i).map(i => parseInt(i, 10));
}

const x509Mapping = {
    CN: 'name',
    O: 'organization',
    OU: 'division',
    C: 'country',
    S: 'state',
    P: 'province',
    L: 'city'
}

async function parseIdentity(data) {
    if (!_.isString(data)) {
        return data;
    }
    if (await fs.pathExists(data)) {
        return fs.readJSON(data);
    }
    const result = {};
    data.split(',').map(i => i.trim().split('=').map(j => j.trim())).forEach((field) => {
        const [key, value] = field;
        result[x509Mapping[key] || key] = value;
    })
    return result;
}

module.exports = {
    readLineSecure,
    processCoordinatesArg,
    parseIdentity
};
