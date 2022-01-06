const _ = require('lodash');
const fs = require('fs-extra');
const platforms = require('../platforms');
const { buildTokenImage, encodeImageData, decodeImageData,
    extractImageCode, extractImageSignature, extractImageHash } = require('../imaging/wildcard');
const { SEPARATOR, generateCode, generateSerialNumber, buildTokenClaims, extractTokenClaims } = require('../common');

function buildImageMessage(token) {
    return `${token.path}${token.version ? ' (' + token.version + ')' : ''}${SEPARATOR}${token.platform}${SEPARATOR}NFTLS.IO${SEPARATOR}${token.code}`;
}

async function createImage(token, key, output) {
    if (token.claims && (token.claims.path || token.claims.platform || token.claims.imageHash)) {
        throw new Error('Invalid claims options.');
    }
    const platform = platforms[token.platform];
    token.id = `${token.path}@${token.platform}`;
    token.code = generateCode();
    token.imageSig = platform.signMessage(key, buildImageMessage(token)).toString('hex');

    // get image hash.
    const tmpImage = await buildTokenImage(token);
    const imageHash = await extractImageHash(tmpImage, false);

    // build initial encoded token string.
    const tokenValue = buildTokenClaims(Object.assign({}, {
        path: token.path,
        platform: token.platform,
        serialNumber: generateSerialNumber(),
        imageHash
    }, token.claims || {}));

    // get signature.
    const sig = platform.signMessage(key, `${token.code}${SEPARATOR}${tokenValue}`);

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
    const code = await extractImageCode(filepath);
    const sigmark = await extractImageSignature(filepath);

    if (!encodedData) {
        throw new Error('No encoded data was located. The provided file is not a valid token.');
    }

    const sig = encodedData.split(SEPARATOR).slice(-1)[0];
    const claims = extractTokenClaims(encodedData);
    const platform = platforms[claims.platform];
    const claimsData = buildTokenClaims(claims);

    const imageSigMsg = buildImageMessage({
        code, platform: claims.platform, path: claims.path
    });

    const sigMsg = `${code}${SEPARATOR}${claimsData}`;

    let sigAddr = null;
    try { sigAddr = platform.recoverAddress(sig, sigMsg); } catch (e) { }
    let sigmarkAddr = null;
    try { sigmarkAddr = platform.recoverAddress(sigmark, imageSigMsg); } catch (e) { }

    return {
        claims,
        signature: {
            value: sig,
            address: sigAddr,    
        },
        image: {
            imageHash: actualImageHash,
            code,
            signature: {
                value: sigmark,
                address: sigmarkAddr
            }
        }
    };
}

async function verifyImage(filepath, addr) {
    const data = _.isString(filepath) ? await inspectImage(filepath) : filepath;

    if (data.claims.imageHash !== data.image.imageHash) {
        return `The SHA-256 hash in the claims does not match actual hash of the image.`;
    }

    if (data.signature.address !== data.image.signature.address) {
        return `The claims signature and image signature addresses do not match!`;
    }

    if (addr) {
        if (data.signature.address !== addr.toLowerCase()) {
            return `Invalid embedded signature address.`;
        }

        if (data.image.signature.address !== addr.toLowerCase()) {
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