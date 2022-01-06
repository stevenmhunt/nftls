const _ = require('lodash');
const fs = require('fs-extra');
const platforms = require('../platforms');
const { buildTokenImage, encodeImageData, decodeImageData,
    extractImageNonce, extractImageSignature, extractImageHash } = require('../imaging/wildcard');
const { SEPARATOR, generateNonce, buildTokenClaims, extractTokenClaims } = require('../common');

const WILDCARD_TOKEN_TYPE = 'NFTLS Wildcard'
const WILDCARD_TOKEN_GRANTS = 'AllowSigningWildcards, AllowSigningItems, AllowVerify'

function buildImageMessage(token) {
    return `${token.path}${token.version ? ' (' + token.version + ')' : ''}${SEPARATOR}${token.platform}${SEPARATOR}NFTLS.IO${SEPARATOR}${token.nonce}`;
}

async function createImage(token, key, output) {
    const platform = platforms[token.platform];
    token.id = `${token.path}@${token.platform}`;
    token.nonce = generateNonce();
    token.imageSig = platform.signMessage(key, buildImageMessage(token)).toString('hex');

    // get image hash.
    const tmpImage = await buildTokenImage(token);
    const imageHash = await extractImageHash(tmpImage, false);

    // build initial encoded token string.
    const tokenValue = buildTokenClaims({
        id: token.id,
        type: WILDCARD_TOKEN_TYPE, grants: WILDCARD_TOKEN_GRANTS,
        imageHash
    });

    // get signature.
    const sig = platform.signMessage(key, `${token.nonce}${SEPARATOR}${tokenValue}`);

    // build final encoded token string.
    const finalTokenValue = `${tokenValue}${SEPARATOR}${sig}`;

    // write encoded token image.
    const resultImage = await encodeImageData(tmpImage, finalTokenValue, output);
    await fs.unlink(tmpImage);
    return resultImage;
}

async function inspectImage(filepath) {
    const encodedData = await decodeImageData(filepath);
    const actualImageHash = await extractImageHash(filepath);
    const nonce = await extractImageNonce(filepath);
    const sigmark = await extractImageSignature(filepath);

    if (!encodedData) {
        throw new Error('No encoded data was located. The provided file is not a valid token.');
    }

    const sig = encodedData.split(SEPARATOR).slice(-1)[0];
    const claimData = extractTokenClaims(encodedData);
    const { type, grants, id, imageHash } = claimData;
    const [path, platformName] = id.split('@');
    const platform = platforms[platformName];
    const claims = buildTokenClaims(claimData);

    const imageSigMsg = buildImageMessage({
        nonce, platform: platformName, path
    });

    const sigMsg = `${nonce}${SEPARATOR}${claims}`;

    let sigAddress = null;
    try { sigAddress = platform.recoverAddress(sig, sigMsg); } catch (e) { }
    let sigmarkAddress = null;
    try { sigmarkAddress = platform.recoverAddress(sigmark, imageSigMsg); } catch (e) { }

    return {
        id,
        type,
        platform: platformName,
        grants,
        claims,
        expectedImageHash: imageHash,
        imageHash: actualImageHash,
        nonce,
        sig,
        sigAddress,
        sigmark,
        sigmarkAddress
    };
}

async function verifyImage(filepath, addr) {
    const data = _.isString(filepath) ? await inspectImage(filepath) : filepath;

    if (data.expectedImageHash !== data.imageHash) {
        return `The SHA-256 hash '${data.expectedImageHash}' does not match actual hash value '${data.imageHash}'.`;
    }

    if (data.sigAddress !== data.sigmarkAddress) {
        return `The claims signature and signature mark addresses do not match!`;
    }

    if (addr) {
        if (data.sigAddress !== addr.toLowerCase()) {
            return `Invalid embedded signature address.`;
        }

        if (data.sigmarkAddress !== addr.toLowerCase()) {
            return `Invalid signature mark address.`;
        }
    }

    return 'Verified';
}

module.exports = {
    createImage,
    inspectImage,
    verifyImage
};