const assert = require('assert');
const ethersLocal = require('ethers');
const axios = require('axios').default;
const { getCertHash, calculatePath } = require('../utils');

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
        const tokenId = ethers.BigNumber.from(pathName && pathName !== '*' ? calculatePath(pathName) : 0);
        const { certificate, revokeTime } = await current.getCertificate(tokenId, true);
        const uri = await current.tokenURI(tokenId);
        const { data } = await axios.get(`${uri}/json`);

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
