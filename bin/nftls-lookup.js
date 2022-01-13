#!/usr/bin/env node
const { main } = require('../src/cli/runner');
const cli = require('../src/cli/nftls-lookup');

const app = 'nftls-lookup';

main({ app, cli }).catch((err) => {
    if (process.env.NFTLS_DEBUG !== '1') {
        // eslint-disable-next-line no-console
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
    throw err;
});
