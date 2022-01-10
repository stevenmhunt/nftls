const path = require('path');
const fs = require('fs-extra');
const homedir = require('os').homedir();

const filepath = path.join(homedir, '.nftls');
let storage = {};

async function load() {
    if (await fs.pathExists(filepath)) {
        storage = await fs.readJSON(filepath);
    }
}

async function save() {
    return fs.writeJSON(filepath, storage, { spaces: 4 });
}

load();