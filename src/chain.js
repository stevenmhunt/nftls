const Jimp = require('jimp');
const { getItem } = require('./cache');

function getChainPaths(id) {
    const path = id.split('@')[0];
    if (path.indexOf('*') > -1 && path.indexOf('*') < path.length - 1) {
        throw new Error('Paths cannot contain the * character except at the end.');
    }
    if (path == '*') {
        return ['root'];
    }
    else if (path.endsWith('*')) {
        const domains = path.split('.');
        if (domains.length <= 2) {
            return ['*', 'root'];
        }
        const nextPath = domains.filter((v, i) => i !== domains.length - 2).join('.');
        return [nextPath, ...getChainPaths(nextPath)];
    }
    else if (path.indexOf('.') >= 0) {
        const domains = path.split('.');
        domains[domains.length - 1] = '*';
        const nextPath = domains.join('.');
        return [nextPath, ...getChainPaths(nextPath)];
    }
    throw new Error(`Invalid path '${id}'.`);
}

async function getTokenAddress(id, timestamp) {
    const [ path, platform ] = id.split('@');
    const result = await getItem(`${id}.address`);
    return result.toString('utf-8').toLowerCase();
}

async function getTokenContents(id) {
    const result = await getItem(`${id}.png`);
    return result;
}

async function downloadTokenChain(id, timestamp) {
    const paths = getChainPaths(id);
    const platform = id.split('@')[1];
    return Promise.all(paths.map(async (path) => {
        const tokenId = `${path}@${platform}`;
        const address = await getTokenAddress(tokenId, timestamp);
        const token = await Jimp.read(await getTokenContents(id));
        return { id: tokenId, address, token };
    }));
}

module.exports = {
    getChainPaths,
    downloadTokenChain
};
