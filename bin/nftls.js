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
const { extractTokenClaims, SEPARATOR, buildTokenClaims } = require('../src/common');

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

async function processClaims(param) {
    if (!param || !_.isString(param)) {
        return {};
    }
    if (param.startsWith('file://')) {
        return extractTokenClaims((await fs.readFile(param.substring(param.indexOf(':') + '://'.length), 'utf-8')).split(EOL).join(SEPARATOR));
    }
    return extractTokenClaims(param.split(';').join(SEPARATOR));
}

const createCommands = {
    'certificate': async function term_create_wildcard(id, image, key) {
        if (!id || !image) {
            console.log('nftls --create <type> <path>@<platform> <base image> (--claims "<claim1: ...; claim2: ...>") (-o <output image>) (<private key>)');
            process.exit(1);
        }
        const [tokenPath, platform] = id.split('@');
        if (!key) {
            key = await readLineSecure('<<<====DANGER====>>>\nPrivate Key: ');
        }
        const keyAddress = eth.getAddress(key);
        const output = argv.o || argv.output || path.basename(image);
        const claims = await processClaims(argv.claims);
        let result = null;
        for (let i = 0; i < 5; i++) {
            await wildcard.createImage({
                path: tokenPath, platform, image, claims
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
        const claims = await processClaims(argv.claims);
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
        const claims = (await wildcardImaging.decodeImageData(filepath)).split(SEPARATOR).slice(0,-1);
        console.log(claims.join(EOL));
    },
    'signature': async function term_inspect_sig(filepath) {
        const data = (await wildcardImaging.decodeImageData(filepath)).split(SEPARATOR);
        console.log(data[data.length - 1]);
    },
    'code': async function term_inspect_code(filepath) {
        const code = await wildcardImaging.extractImageCode(filepath);
        console.log(code);
    },
    'hash': async function term_inspect_hash(filepath) {
        const hash = await wildcardImaging.extractImageHash(filepath, true);
        console.log(hash);
    },
    'certificate': async function term_inspect_certificate(filepath) {
        const data = await wildcard.inspectImage(filepath);
        const claims = buildTokenClaims(data.claims);
        const format = argv.f || argv.format || 'text';
        if (format === 'text') {
            console.log('Certificate:');
            console.log('    Claims:');
            console.log(`        ${claims.split(SEPARATOR).join(EOL + '        ')}`);
            console.log('    Signature:');
            console.log(`        ${data.signature.value}`);
            console.log(`        Address: ${data.signature.address}`);
            console.log('    Image:');
            console.log(`        Code: ${data.image.code}`);
            console.log(`        SHA-256: ${data.image.imageHash}`);
            console.log('        Signature:');
            console.log(`            ${data.image.signature.value}`);
            console.log(`            Address: ${data.image.signature.address}`);
        }
        else if (format === 'compact-json') {
            console.log(JSON.stringify(data));
        }
        else if (format === 'json') {
            console.log(JSON.stringify(data, null, 4));
        }
    }
}

const recoverCommands = {
    'signature': async function (filepath) {
        const code = await wildcardImaging.extractImageCode(filepath);
        const data = (await wildcardImaging.decodeImageData(filepath)).split(SEPARATOR);
        const claims = data.slice(0,-1);
        const sig = data[data.length - 1];
        const msg = [code, ...claims].join(SEPARATOR);
        console.log(eth.recoverAddress(sig, msg));
    }
}

const verifyCommands = {
    'certificate': async function term_verify_wildcard(filepath, address) {
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
            if (token.signatureAddress != chain[0].address.toLowerCase()) {
                console.log(` x The signature address does not match the token chain address.`);
                return process.exit(1);
            }
        }
    },
    'signature': async function term_verify_signature(id, filepath, addr) {
        const claims = await processClaims(argv.claims);
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