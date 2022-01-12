#!/usr/bin/env node
const { main } = require('../src/cli/runner');
const cli = require('../src/cli/nftls');

const app = 'nftls';

main({ app, cli });
/*    .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }); */
