#!/usr/bin/env node
/* eslint-disable no-console */
const silence = console.info;
console.info = () => { };
const { createIdentity } = require('eth-crypto');

console.info = silence;

if (process.argv[2] === 'eth') {
    const { privateKey, publicKey, address } = createIdentity();
    console.log(privateKey);
    console.error(`Public Key: ${publicKey}`);
    console.error(`Address: ${address}`);
} else {
    console.error('nftls-keygen\n\nUsage: nftls-keygen eth > secret.key');
}
