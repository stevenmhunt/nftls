const assert = require('assert');
const ethersLocal = require('ethers');
const axios = require('axios').default;
const { getCertHash, calculatePath } = require('../utils');
const { abi } = require('./NftlsToken.json');

ethersLocal.utils.Logger.setLogLevel('error');

/**
 * Builds an Ethereum connector object.
 */
module.exports = async function ethConnector(network, options, providerType, typeParam) {
    // eslint-disable-next-line no-param-reassign
    network = network === 'local' ? 'http://localhost:8545' : network;
    const ethers = options.ethers || ethersLocal;

    function getProvider() {
        if (!network) {
            return ethers.getDefaultProvider();
        }
        if (!providerType) {
            return ethers.getDefaultProvider(network);
        }
        return new ethers.providers[`${providerType}Provider`](network, typeParam);
    }

    const provider = options.provider || getProvider();
    const contractValue = options.contract
        || new ethers.Contract(ethers.constants.AddressZero, abi, provider);
    let current = contractValue;

    /**
     * Sets the current token contract address to use.
     * The address change if a wildcard domain certificate issues its own tokens.
     * @param {*} contractId The address of the contract.
     * @returns {Promise<string>} The resolved contract address.
     */
    async function setTokenContract(contractId) {
        const addresses = [];
        async function setTokenContractInternal(c) {
            current = await contractValue.attach(c);
            const result = await current.redeployedAddress();
            if (result !== ethers.constants.AddressZero) {
                assert.equal(addresses.indexOf(c), -1, `Infinite recursion detected in deployment address '${c}'.`);
                addresses.push(c);
                return setTokenContractInternal(result);
            }
            return c;
        }
        return setTokenContractInternal(contractId);
    }

    /**
     * Locates an NFTLS token in the blockchain and downloads the required certificate.
     * @param {*} pathName The path of the certificate.
     * @returns {Promise} The certificate.
     */
    async function downloadCertificate(pathName) {
        const tokenId = ethers.BigNumber.from(pathName && pathName !== '*' ? calculatePath(pathName) : 0);
        const { certificate, revokeTime } = await current.getCertificate(tokenId, true);
        const uri = await current.tokenURI(tokenId);
        const { data } = await axios.get(uri);

        // we don't trust the downloaded certificate unless it matches the hash from blockchain.
        assert.ok(revokeTime.isZero(), 'The requested certificate was revoked and not re-minted.');
        assert.equal(getCertHash(data.certificate, data.signature), certificate, 'Inconsistent certificate hashes.');
        return data;
    }

    return {
        setTokenContract,
        downloadCertificate,
    };
};
