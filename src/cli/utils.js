/* eslint-disable no-console */
const _ = require('lodash');
const fs = require('fs-extra');
const readline = require('readline');
const clc = require('cli-color');
const { Spinner } = require('cli-spinner');
const { parseX509Fields } = require('../utils');
const { userProfile } = require('../storage');
const { createSessionContext } = require('../certificateChains');
const { PLATFORMS_KEY, STDIO_ARG } = require('../constants');

/**
 * Manages standard input prompts.
 */
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

/**
 * Processes the coordinates argument from the command-line.
 */
function processCoordinatesArg(argv) {
    return (argv.coordinates || '6,6,6,6').split(',').filter((i) => i).map((i) => parseInt(i, 10));
}

/**
 * Processes the identity information from the command-line.
 */
async function processIdentityArg(data) {
    if (!_.isString(data)) {
        return data;
    }
    if (await fs.pathExists(data)) {
        return fs.readJSON(data);
    }
    return parseX509Fields(data);
}

/**
 * Renders the validation status.
 */
function displayStatus(result, expected = 'Valid') {
    if (_.isString(result)) {
        console.log(` ${(expected === true ? clc.green('✓') : clc.red('✗'))} ${result}`);
        return;
    }
    const { status, error } = result;
    console.log(` ${(expected === null || status === expected ? clc.green('✓') : clc.red('✗'))} ${status || error}`);
}

/**
 * Captures the output of a function and pipes it into the appropriate file descriptor
 * based on the --output or -o command-line argument.
 */
async function withOutput(result, output) {
    if (output === STDIO_ARG) {
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

/**
 * Displays a progress spinner until the operation is completed.
 */
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

// TODO: integrate live blockchain session context.
let session;
async function getSessionContext() {
    if (!session) {
        const storage = await userProfile();
        const platformOptions = await storage.getItems(PLATFORMS_KEY);
        session = await createSessionContext(platformOptions, storage);
    }
    return session;
}

// source: https://stackoverflow.com/a/68978413/1267688
const BUFSIZE = 256;
const buf = Buffer.alloc(BUFSIZE);
let bytesRead;
let stdin = '';
function stdinToString() {
    do {
        // Loop as long as stdin input is available.
        bytesRead = 0;
        try {
            bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
        } catch (e) {
            if (e.code === 'EAGAIN') {
                // 'resource temporarily unavailable'
                // Happens on OS X 10.8.3 (not Windows 7!), if there's no
                // stdin input - typically when invoking a script without any
                // input (for interactive stdin input).
                // If you were to just continue, you'd create a tight loop.
                throw new Error('ERROR: interactive stdin input not supported.');
            } else if (e.code === 'EOF') {
                // Happens on Windows 7, but not OS X 10.8.3:
                // simply signals the end of *piped* stdin input.
                break;
            }
            throw e; // unexpected exception
        }
        if (bytesRead === 0) {
            // No more stdin input available.
            // OS X 10.8.3: regardless of input method, this is how the end
            //   of input is signaled.
            // Windows 7: this is how the end of input is signaled for
            //   *interactive* stdin input.
            break;
        }
        // Process the chunk read.
        stdin += buf.toString(undefined, 0, bytesRead);
    } while (bytesRead > 0);

    return stdin;
}

module.exports = {
    readLine,
    processCoordinatesArg,
    processIdentityArg,
    displayStatus,
    withOutput,
    withProgress,
    getSessionContext,
    stdinToString,
};
