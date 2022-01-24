const path = require('path');
const fs = require('fs-extra');
const homedir = require('os').homedir();

async function initializeUserProfileStorage() {
    const filepath = path.join(homedir, '.nftls');
    let storage = {};

    // automatically load the user configuration on startup.
    if (await fs.pathExists(filepath)) {
        storage = await fs.readJSON(filepath);
    }

    /**
     * @private
     * Save the current user configuration.
     * @returns {Promise}
     */
    async function save() {
        return fs.writeJSON(filepath, storage, { spaces: 4 });
    }

    /**
     * @private
     * Adds an item to a key/value object.
     * @param {string} name The object name.
     * @param {string} key The key to add.
     * @param {object} value the value to add.
     * @returns {Promise}
     */
    async function addKeyItem(name, key, value) {
        storage[name] = storage[name] || {};
        storage[name][key] = value;
        await save();
    }

    /**
     * @private
     * Removes an item from a key/value object.
     * @param {string} name The object name.
     * @param {string} key The key to add.
     * @returns {Promise}
     */
    async function removeKeyItem(name, key) {
        storage[name] = storage[name] || {};
        delete storage[name][key];
        await save();
    }

    /**
     * @private
     * Adds an item to an array object.
     * @param {string} nane The object name.
     * @param {object} value The value to add.
     * @returns {Promise}
     */
    async function addListItem(nane, value) {
        storage[nane] = storage[nane] || [];
        storage[nane].push(value);
        await save();
    }

    /**
     * @private
     * Gets the items associated with an object.
     * @param {string} name The object name.
     * @returns {Promise}
     */
    async function getItems(name) {
        return storage[name] || {};
    }

    /**
     * @private
     * Gets a specific value from a key within an object.
     * @param {*} name The object name.
     * @param {*} key The key to get data from.
     * @returns {Promise}
     */
    async function getKeyItem(name, key) {
        return (await getItems(name))[key];
    }

    return {
        getKeyItem,
        getItems,
        addKeyItem,
        addListItem,
        removeKeyItem,
    };
}

module.exports = initializeUserProfileStorage;
