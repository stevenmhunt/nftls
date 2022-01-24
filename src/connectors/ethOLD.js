const axios = require('axios').default;
const { generateCallData } = require('../platforms/eth');

/**
 * A list of supported Ethereum environments.
 */
const environments = {
    mainnet: 'https://api.etherscan.io/',
    kovan: 'https://api-kovan.etherscan.io/',
    goerli: 'https://api-goerli.etherscan.io/',
    rinkeby: 'https://api-rinkeby.etherscan.io/',
    ropsten: 'https://api-ropsten.etherscan.io/',
};

/**
 * @private
 * Given a contract address and a token id, locates a token's associated URI.
 * @param {object} context The connection context.
 * @param {string} to The Ethereum address associated with the token.
 * @param {*} tokenId The token ID as a number or hex string.
 * @returns {Promise<string>} The associated URI.
 */
async function getTokenURI(context, to, tokenId) {
    const data = await context.performEtherscanCall({
        module: 'proxy',
        action: 'eth_call',
        to,
        data: generateCallData('tokenURI', ['uint256'], [tokenId]),
    });
    return Buffer.from(data.substring(64 * 2 + 2, data.length - 12), 'hex').toString('utf8');
}

/**
 * @private
 * Given a token URI, downloads the token image.
 * @param {object} context The connection context.
 * @param {string} uri The token URI.
 * @returns {Promise<Buffer>} The binary data from the token.
 */
async function resolveTokenURI(context, uri) {
    if (!uri) {
        throw new Error('The uri parameter is required.');
    }

    // http/https tokens can be downloaded directly.
    if (uri.startsWith('http')) {
        return context.performExternalCall(uri);
    }

    // if using IPFS, get the gateway URI and then download.
    if (uri.startsWith('ipfs://')) {
        const { imageUrl } = await context.performExternalCall(`https://ipfs.io/${uri.substring('ipfs://'.length)}`);
        return context.performExternalCall(imageUrl, true);
    }
    throw new Error('Unknown URI type.');
}

function etherscanClientFactory(apiKey, env = 'mainnet') {
    // initiate HTTP client.
    const context = {
        /**
         * @private
         * Performs a call against the etherscan.io API.
         * @param {*} args The arguments to pass into the call.
         * @returns {Promise<object>} The response from the API.
         */
        performCall: async function performEtherscanCall(args = {}) {
            const { data } = await axios.get(`${environments[env]}/api`, {
                params: { ...args, tag: 'latest', apiKey },
            });
            return data.result;
        },

        /**
         * @private
         * Performs an external HTTP call.
         * @param {string} url The URL to download.
         * @param {boolean} isBinary Whether or not the file is a binary file.
         * @returns Promise<*> The response data.
         */
        performExternalCall: async function performExternalCall(url, isBinary = false) {
            const { data } = await axios.get(url, {
                responseType: isBinary ? 'arraybuffer' : undefined,
            });
            return data;
        },
    };

    return {
    // online lookup functions go here...
        locateCertificate: async function locateCertificate(address, tokenId) {
            // no idea how this works yet...
            const token = await getTokenURI(context, address, tokenId);
            return resolveTokenURI(context, token);
        },
    };
}

module.exports = etherscanClientFactory;
