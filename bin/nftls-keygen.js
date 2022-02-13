#!/usr/bin/env node
/* eslint-disable no-console */
const platforms = require('../src/platforms');

if (process.argv[2] === 'eth') {
    const { privateKey, publicKey, address } = platforms.eth.generateWallet();
    console.log(privateKey);
    console.error(`Public Key: ${publicKey}`);
    console.error(`Address: ${address}`);
} else {
    console.error('nftls-keygen\n\nUsage: nftls-keygen eth > secret.key');
}
