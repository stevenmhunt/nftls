#!/usr/bin/env node
const { EOL } = require('os');
const path = require('path');
var readline = require('readline');
const Jimp = require('jimp');
const sigmark = require('eth-signature-mark');
const argv = require('mri')(process.argv.slice(2));
const package = require('../package.json');

const tldImage = require('../src/imaging/tld');
const tld = require('../src/tld');
const eth = require('../src/platforms/eth');

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

const createCommands = {
    'tld': async function term_create_tld(id, image, key) {
        if (!id || !image) {
            console.log('nftld --create <type> <path>@<platform> <base image> (-o <output image>) (-k <private key>)');
            process.exit(1);
        }
        const [tokenPath, platform] = id.split('@');
        if (!key) {
            key = await readLineSecure('<<<====DANGER====>>>\nPrivate Key: ');
        }
        const keyAddress = eth.getAddress(key);
        const output = argv.o || argv.output || path.basename(image);
        let result = null;
        for (let i = 0; i < 5; i++) {
            await tld.createImage({
                type: 'tld', path: tokenPath, platform, image
            }, key, output);
            result = await tld.verifyImage(output, keyAddress);
            if (result == 'Verified') {
                console.log(" ✓ Token generated and verified.");
                return;
            }
        }
        throw new Error(result);
    }
}

const decodeCommands = {
    'sigmark': async function term_decode_sigmark(filepath) {
        let result = null;
        if (argv.x !== undefined && argv.y !== undefined && argv.w && argv.h) {
            const image = await Jimp.read(filepath);
            const x = 3;
            const y = 3;
            const w = 3;
            const h = 3;
            result = await sigmark.extractSignatureMark(image, x, y, w, h);
        }
        else {
            result = await tldImage.extractImageSignature(filepath);
        }
    },
    'claims': async function term_decode_claims(filepath) {
        const claims = (await tldImage.decodeImageData(filepath)).split('\r\n').slice(0,-1);
        console.log(claims.join(EOL));
    },
    'sig': async function term_decode_sig(filepath) {
        const data = (await tldImage.decodeImageData(filepath)).split('\r\n');
        console.log(data[data.length - 1]);
    },
    'nonce': async function term_decode_nonce(filepath) {
        const nonce = await tldImage.extractImageNonce(filepath);
        console.log(nonce);
    },
    'hash': async function term_decode_hash(filepath) {
        const hash = await tldImage.extractImageHash(filepath, true);
        console.log(hash);
    },
    'tld': async function term_decode_tld(filepath) {
        const data = await tld.decodeImage(filepath);
        console.log(`NFTLD Token '${data.id}':\n`);
        console.log('  Claims:\n');
        console.log(`    ${data.claims.split('\r\n').join(EOL + '    ')}\n`);
        console.log('  Claims Signature:\n');
        console.log(`    ${data.sig}`);
        console.log(`    address: ${data.sigAddress}\n`);
        console.log('  Image:\n');
        console.log(`    Nonce: ${data.nonce}`);
        console.log(`    SHA-256: ${data.imageHash}\n`);
        console.log('  Signature Mark:\n');
        console.log(`    ${data.sigmark}`);
        console.log(`    address: ${data.sigmarkAddress}\n`);
    }
}

const recoverCommands = {
    'sig': async function (filepath) {
        const nonce = await tldImage.extractImageNonce(filepath);
        const data = (await tldImage.decodeImageData(filepath)).split('\r\n');
        const claims = data.slice(0,-1);
        const sig = data[data.length - 1];
        const msg = [nonce, ...claims].join('\r\n');
        console.log(eth.recoverAddress(sig, msg));
    }
}

const verifyCommands = {
    'tld': async function (filepath, address) {
        const result = await tld.verifyImage(filepath, address);
        console.log(` ${(result === 'Verified' ? '✓' : 'x')} ${result}`);
        if (result !== 'Verified') {
            return process.exit(1);
        }
    }
}

async function main() {
    try {
        if (argv.c || argv.create) {
            const target = argv.c || argv.create;
            if (createCommands[target]) {
                await createCommands[target](...argv._);
                return;
            }
        }

        if (argv.d || argv.decode) {
            const target = argv.d || argv.decode;
            if (decodeCommands[target]) {
                await decodeCommands[target](...argv._);
                return;
            }
        }

        if (argv.r || argv.recover) {
            const target = argv.r || argv.recover;
            if (recoverCommands[target]) {
                await recoverCommands[target](...argv._);
                return;
            }
        }
        if (argv.v && argv.v !== true || argv.verify) {
            const target = argv.v || argv.verify;
            if (verifyCommands[target]) {
                await verifyCommands[target](...argv._);
                return;
            }
        }

        if (argv.v === true || argv.version === true) {
            console.log(package.version);
            return;
        }
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

main();