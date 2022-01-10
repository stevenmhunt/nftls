const path = require('path');
const fs = require('fs-extra');
const homedir = require('os').homedir();

const filepath = path.join(homedir, '.nftls');
let storage = {};

if (fs.pathExistsSync(filepath)) {
    storage = fs.readJSONSync(filepath);
}

async function save() {
    return fs.writeJSON(filepath, storage, { spaces: 4 });
}

async function addKeyItem(key, name, value) {
    storage[key] = storage[key] || {};
    storage[key][name] = value;
    await save();
}

async function addListItem(key, value) {
    storage[key] = storage[key] || [];
    storage[key].push(value);
    await save();
}

async function getItems(key) {
    return storage[key] || {};
}

async function getKeyItem(key, name) {
    return (await getItems(key))[name];
}

module.exports = {
    getKeyItem,
    getItems,
    addKeyItem,
    addListItem
};
