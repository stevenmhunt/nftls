#!/usr/bin/env node
const { main } = require('../src/cli/runner');
const cli = require('../src/cli/nftls-lookup');

const app = 'nftls-lookup';

main({ app, cli });
/*    .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }); */
