// eslint-disable-next-line global-require
const ethersLocal = typeof window !== 'undefined' && window.ethers ? window.ethers : require('ethers');
const assert = require('assert');
const axios = require('axios').default;
const { getCertHash, calculatePath } = require('../utils');
const { abi } = require('./NftlsToken.json');

ethersLocal.utils.Logger.setLogLevel('error');

/**
 * Ethereum-compatible blockchain connection wrapper.
 */
module.exports = function ethConnectionWrapper(platformName) {
    /**
     * Builds an Ethereum connector object.
     */
    return async function ethConnector(network, options, providerType, typeParam) {
        // eslint-disable-next-line no-param-reassign
        network = network === 'local' ? 'http://localhost:8545' : network;
        const ethers = options.ethers || ethersLocal;

        function getProvider() {
            if (platformName === 'eth') {
                if (!network) {
                    return ethers.getDefaultProvider();
                }
                if (!providerType || providerType === 'default') {
                    return ethers.getDefaultProvider(network);
                }
            }
            return new ethers.providers[`${providerType}Provider`](network, typeParam);
        }
        const addr = ethers.constants.AddressZero;
        const contractValue = options.contract
            || new ethers.Contract(addr, abi, options.provider || getProvider());
        let current = contractValue;
        let pendingContract = null;

        /**
         * @private
         * Sets the current token contract address to use.
         * The address change if a wildcard domain certificate issues its own tokens.
         * @param {*} contractId The address of the contract.
         * @returns {Promise<string>} The resolved contract address.
         */
        async function setTokenContractInternal(contractId) {
            const addresses = [];
            async function setTokenContractInternalPrivate(c) {
                current = await contractValue.attach(c);
                const result = await current.redeployedAddress();
                if (result !== ethers.constants.AddressZero) {
                    assert.equal(addresses.indexOf(c), -1, `Infinite recursion detected in deployment address '${c}'.`);
                    addresses.push(c);
                    return setTokenContractInternalPrivate(result);
                }
                return c;
            }
            return setTokenContractInternalPrivate(contractId);
        }

        /**
         * Sets the current token contract address to use.
         */
        async function setTokenContract(contractId) {
            pendingContract = contractId;
        }

        /**
         * Locates an NFTLS token in the blockchain and downloads the required certificate.
         * @param {*} pathName The path of the certificate.
         * @returns {Promise} The certificate.
         */
        async function downloadCertificate(pathName) {
            if (pendingContract) {
                await setTokenContractInternal(pendingContract);
                pendingContract = null;
            }
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
};
