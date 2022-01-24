const assert = require('assert');
const ethersLocal = require('ethers');
const axios = require('axios').default;
const { keccak256 } = require('../utils');

module.exports = async function ethConnector(options = {}) {
    const ethers = options.ethers || ethersLocal;
    // const provider = options.provider || eth.getDefaultProvider(options.defaultProvider);
    const contractValue = options.contract;
    let current = contractValue;

    async function setTokenContract(contractId) {
        const addresses = [];
        async function setTokenContractInternal(c) {
            current = await contractValue.attach(c);
            const result = await current.redeployedAddress();
            if (result !== ethers.constants.AddressZero) {
                assert.equal(addresses.indexOf(c), -1, `Infinite recursion detected in deployment address '${c}'.`);
                addresses.push(c);
                await setTokenContractInternal(result);
            }
        }
        return setTokenContractInternal(contractId);
    }

    async function downloadCertificate(pathName) {
        const tokenId = ethers.BigNumber.from(pathName && pathName !== '*' ? keccak256(pathName) : 0);
        const { certificate, isActive } = await current.getCertificate(tokenId);
        const uri = await current.tokenURI(tokenId);
        const { data } = await axios.get(uri);

        // we don't trust the downloaded certificate unless it matches the hash from blockchain.
        assert.ok(isActive, 'The requested certificate was revoked and not re-minted.');
        assert.equal(keccak256(Buffer.from(data.certificate, 'base64')), certificate, 'Inconsistent certificate hashes.');
        return data;
    }

    return {
        setTokenContract,
        downloadCertificate,
    };
};
