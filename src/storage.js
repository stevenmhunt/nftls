const path = require('path');
const fs = require('fs-extra');
const homedir = require('os').homedir();

const filepath = path.join(homedir, '.nftls');
let storage = {
    rootCAs: {}
};

if (fs.pathExistsSync(filepath)) {
    storage = fs.readJSONSync(filepath);
}

async function save() {
    return fs.writeJSON(filepath, storage, { spaces: 4 });
}

async function addRootCA(name, values) {
    storage.rootCAs[name] = values;
    await save();
}

async function getStorage() {
    return storage;
}

module.exports = {
    getStorage,
    addRootCA
};
