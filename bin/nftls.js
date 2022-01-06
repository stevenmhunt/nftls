#!/usr/bin/env node
const { EOL } = require('os');
const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const readline = require('readline');
const Jimp = require('jimp');
const sigmark = require('eth-signature-mark');
const argv = require('mri')(process.argv.slice(2));
const package = require('../package.json');

const wildcardImaging = require('../src/imaging/wildcard');
const wildcard = require('../src/types/wildcard');
const item = require('../src/types/item');
const eth = require('../src/platforms/eth');
const { downloadTokenChain } = require('../src/chain');

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

async function processDomainClaims(param) {
    if (!param || !_.isString(param)) {
        return [];
    }
    if (param.startsWith('file://')) {
        return (await fs.readFile(param.substring(param.indexOf(':') + '://'.length), 'utf-8')).split(EOL);
    }
    return param.split(';');
}

const createCommands = {
    'wildcard': async function term_create_wildcard(id, image, key) {
        if (!id || !image) {
            console.log('nftls --create <type> <path>@<platform> <base image> (-o <output image>) (-k <private key>)');
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
            await wildcard.createImage({
                path: tokenPath, platform, image
            }, key, output);
            result = await wildcard.verifyImage(output, keyAddress);
            if (result == 'Verified') {
                console.log(` ✓ Token ${id} generated and verified.`);
                return;
            }
        }
        throw new Error(result);
    },
    'item': async function term_create_domain(id, image, key) {
        if (!key) {
            key = await readLineSecure('<<<====DANGER====>>>\nPrivate Key: ');
        }
        const claims = await processDomainClaims(argv.claims);
        const coordinates = (argv.coordinates || '6,6,6,6').split(',').filter(i => i).map(i => parseInt(i, 10));
        const { signature, nonce } = await item.createImage({
            id, claims, coordinates, nonce: argv.nonce === true
        }, key, image);
        console.log(signature);
        if (argv.nonce === true) {
            console.log(nonce);
        }
    }
}

const inspectCommands = {
    'signature-mark': async function term_inspect_sigmark(filepath) {
        let result = null;
        if (argv.coordinates !== undefined) {
            const image = await Jimp.read(filepath);
            const coordinates = (argv.coordinates || '6,6,6,6').split(',').filter(i => i).map(i => parseInt(i, 10));
            result = await sigmark.extractSignatureMark(image, ...coordinates);
        }
        else {
            result = await wildcardImaging.extractImageSignature(filepath);
        }
        console.log(result);
    },
    'claims': async function term_inspect_claims(filepath) {
        const claims = (await wildcardImaging.decodeImageData(filepath)).split('\r\n').slice(0,-1);
        console.log(claims.join(EOL));
    },
    'signature': async function term_inspect_sig(filepath) {
        const data = (await wildcardImaging.decodeImageData(filepath)).split('\r\n');
        console.log(data[data.length - 1]);
    },
    'nonce': async function term_inspect_nonce(filepath) {
        const nonce = await wildcardImaging.extractImageNonce(filepath);
        console.log(nonce);
    },
    'hash': async function term_inspect_hash(filepath) {
        const hash = await wildcardImaging.extractImageHash(filepath, true);
        console.log(hash);
    },
    'certificate': async function term_inspect_certificate(filepath) {
        const data = await wildcard.inspectImage(filepath);
        console.log('Certificate:');
        console.log('    Claims:');
        console.log(`        ${data.claims.split('\r\n').join(EOL + '        ')}`);
        console.log('    Signature:');
        console.log(`        ${data.sig}`);
        console.log(`        Address: ${data.sigAddress}`);
        console.log('    Image:');
        console.log(`        Nonce: ${data.nonce}`);
        console.log(`        SHA-256: ${data.imageHash}`);
        console.log('        Signature:');
        console.log(`            ${data.sigmark}`);
        console.log(`            Address: ${data.sigmarkAddress}`);
    }
}

const recoverCommands = {
    'signature': async function (filepath) {
        const nonce = await wildcardImaging.extractImageNonce(filepath);
        const data = (await wildcardImaging.decodeImageData(filepath)).split('\r\n');
        const claims = data.slice(0,-1);
        const sig = data[data.length - 1];
        const msg = [nonce, ...claims].join('\r\n');
        console.log(eth.recoverAddress(sig, msg));
    }
}

const verifyCommands = {
    'wildcard': async function term_verify_wildcard(filepath, address) {
        const token = await wildcard.inspectImage(filepath);
        const result = await wildcard.verifyImage(token, address);
        console.log(` ${(result === 'Verified' ? '✓' : 'x')} ${result}`);
        if (result !== 'Verified') {
            return process.exit(1);
        }
        if (argv.chain === true) {
            const chain = await downloadTokenChain(token.id);
            for (let link in chain) {
                const linkResult = await wildcard.verifyImage(link.token, link.address);
                if (linkResult !== 'Verified') {
                    console.log(` x ${linkResult}`);
                    return process.exit(1);
                }
            }
            if (token.sigAddress != chain[0].address.toLowerCase()) {
                console.log(` x The signature address does not match the token chain address.`);
                return process.exit(1);
            }
        }
    },
    'item': async function term_verify_domain(id, filepath, addr) {
        const claims = await processDomainClaims(argv.claims);
        const coordinates = (argv.coordinates || '6,6,6,6').split(',').filter(i => i).map(i => parseInt(i, 10));
        const nonce = argv.nonce !== undefined ? argv.nonce : null;

        const result = await item.verifyImage({ id, claims, coordinates }, filepath, addr, nonce);
        if (argv.chain === true && !addr) {
            const addrToCheck = result;
            return verifyCertificateChain(id, addrToCheck);
        }

        console.log(` ${(result === 'Verified' ? '✓' : 'x')} ${result}`);
        if (result !== 'Verified') {
            return process.exit(1);
        }
    }
}

async function main() {
    if (argv.c || argv.create) {
        const target = argv.c || argv.create;
        if (createCommands[target]) {
            await createCommands[target](...argv._);
            return;
        }
    }

    if (argv.i || argv.inspect) {
        const target = argv.i || argv.inspect;
        if (inspectCommands[target]) {
            await inspectCommands[target](...argv._);
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

main()
/*    .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    });*/