/* eslint-disable no-underscore-dangle */
const _ = require('lodash');
const connectors = require('./connectors');
const { inspectCertificate, validateCertificate } = require('./certificates');
const { getCertificateAuthorities } = require('./certificateAuthorities');
const { calculateChainPaths, extractPath } = require('./utils');
const { inMemory } = require('./storage');
const { ROOT_CERT_PATH, PLATFORMS_KEY } = require('./constants');
const { getCachedCertificate, addCachedCertificate } = require('./cachedCertificates');

/**
 * @private
 * Follows a predicted certificate chain path in order to locate and validate certificates.
 * @param {object} context The session context.
 * @param {object} paths The path names to follow.
 * @param {string} name The next path name to find.
 * @param {string} addr The next address to find.
 * @param {string} forAddr The next for address to find.
 * @param {string} target The target address we're trying to reach.
 * @returns {Array} A list of all acquired certificates.
 */
async function _resolveCertificateChain(context, paths, name, addr, forAddr, isContract, options) {
    const { target, cache } = options;
    const { pathName, platformName } = extractPath(name);
    if (paths.length === 0 || (addr === target && paths[0] !== ROOT_CERT_PATH)) {
        // if we ran out of paths to validate, then we successfully walked across the chain.
        return [];
    }

    // a contract has been encounted which means we've crossed a token boundary.
    if (forAddr && isContract) {
        await context.platforms[platformName].setTokenContract(forAddr);
    }

    // acquire certificate.
    let data;
    if (cache || name.startsWith('@')) {
        data = await getCachedCertificate(context, name);
    }
    if (!data) {
        try {
            const cert = await context.platforms[platformName].downloadCertificate(pathName);
            data = await inspectCertificate(cert);
            if (cache) {
                await addCachedCertificate(context, cert, true);
            }
        } catch (err) {
            // if we can't get data from the blockchain, then the chain validation is incomplete.
            return [null];
        }
    }

    // if we don't find a certificate that matches our criteria, then the chain is broken.
    if (!data) {
        return [null];
    }

    // analyze certificate.
    const nextAddress = data.certificate.requestAddress;
    const nextfor = data.certificate.forAddress;
    const nextIsContract = data.certificate.contractNonce !== undefined;
    const { status, error } = await validateCertificate(data, addr);
    data.status = status;

    // if something bad happened, then we can't complete the chain.
    if (error) {
        return [null];
    }

    // if we found the target address, then we completed the chain.
    if (addr === target) {
        return [data];
    }

    return [data,
        ...(await _resolveCertificateChain(
            context,
            paths.slice(1),
            `${paths[0]}@${platformName}`,
            nextAddress,
            nextfor,
            nextIsContract,
            options,
        )),
    ];
    // TODO: add cycle detection.
}

/**
 * Resolves certificate chain information for a given certificate.
 * Note: requires an Internet connection.
 * @param {object} context The session context.
 * @param {*} certData The certificate to inspect chain data from.
 * @returns {Promise<object>} Any located certificates, as well as whether the chain status.
 */
async function resolveCertificateChain(context, certData, options) {
    const data = await inspectCertificate(certData);
    if ((await validateCertificate(data)).error) {
        throw new Error('The provided certificate is not valid.');
    }

    const targetAddress = data.signatureAddress;
    const targetName = data.certificate.subject.name;
    const { pathName: certPath, platformName: certPlatform } = extractPath(targetName);
    const paths = [
        certPath,
        ...calculateChainPaths(certPath),
    ].reverse().slice(1);
    const CAs = (await getCertificateAuthorities(context))
        .filter((i) => i.platform === certPlatform);
    // TODO: reseach whether this process could be performed in parallel safely.
    for (let i = 0; i < CAs.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const chain = await _resolveCertificateChain(
            context,
            paths,
            `@${certPlatform}`,
            CAs[i].address,
            CAs[i].forAddress,
            true,
            { target: targetAddress, ...options },
        );
        if (chain.length === 0 || chain[chain.length - 1]) {
            return { status: 'Complete', chain };
        }
        if (chain.length > 0) {
            return { status: 'Incomplete', chain };
        }
    }
    return { status: 'CA Not Found', chain: [] };
}

/**
 * Verifies whether a certificate and its chain of certificates is valid.
 * @param {object} context The session context.
 * @param {*} certData The certificate to validate chain data from.
 * @returns {Promise<string>} Returns "Verified" if verified, otherwise returns an error message.
 */
async function validateCertificateChain(context, certData) {
    const { status } = await resolveCertificateChain(context, certData, { cache: true });
    if (status === 'Complete') {
        return { status: 'Valid' };
    }
    return { status: 'Invalid', error: status };
}

async function downloadCertificate(context, path, { cache }) {
    const [pathName, platformName] = path.split('@');
    const CAs = (await getCertificateAuthorities(context))
        .filter((i) => i.platform === platformName);
        // TODO: reseach whether this process could be performed in parallel safely.
    for (let i = 0; i < CAs.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await context.platforms[platformName].setTokenContract(CAs[i].forAddress);
        if (cache) {
            // eslint-disable-next-line no-await-in-loop
            const data = await getCachedCertificate(context, path);
            if (data) {
                return data;
            }
        }
        // eslint-disable-next-line no-await-in-loop
        const result = await context.platforms[platformName].downloadCertificate(pathName);
        if (result) {
            return result;
        }
    }
    return null;
}

/**
 * Creates a session context for performing lookups against a blockchain.
 * @param {*} platformOptions The platform(s) to use.
 * @param {*} storage Storage and caching options.
 * @returns {Promise<object>} A session context.
 */
async function createSessionContext(platformOptions, storage = null) {
    if (!platformOptions && !storage) {
        const memStorage = await inMemory();
        const options = await memStorage.getItems(PLATFORMS_KEY);
        return createSessionContext(options, memStorage);
    }
    const platformConnectors = {};
    await Promise.all(_.keys(platformOptions).map(async (platform) => {
        let options = {}; let args = [];
        if (platformOptions[platform]) {
            if (_.isArray(platformOptions[platform])) {
                args = platformOptions[platform];
            } else {
                options = platformOptions[platform];
            }
        }
        const [platformName, network] = platform.split(':');
        platformConnectors[platform] = await connectors[platformName](network, options, ...args);
    }));
    return {
        platforms: platformConnectors,
        storage: storage || (await inMemory()),
    };
}

module.exports = {
    resolveCertificateChain,
    validateCertificateChain,
    downloadCertificate,
    createSessionContext,
};
