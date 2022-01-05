const fs = require('fs-extra');
const platforms = require('./platforms');
const { buildTokenImage, encodeImageData, decodeImageData,
    extractImageNonce, extractImageSignature, extractImageHash } = require('./imaging/tld');
const { SEPARATOR, generateNonce, buildTokenClaims } = require('./common');

const TLD_TOKEN_CLAIM = "NFTLD TLD Token: AllowSigning, AllowSubDomains, VerifyIdentity";

function buildImageMessage(token) {
    return `${token.path}${SEPARATOR}${token.platform}${SEPARATOR}NFTLD${SEPARATOR}${token.nonce}`;
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
    const tokenValue = buildTokenClaims([TLD_TOKEN_CLAIM, token.id, imageHash]);

    // get signature.
    const sig = platform.signMessage(key, `${token.nonce}${SEPARATOR}${tokenValue}`);

    // build final encoded token string.
    const finalTokenValue = `${tokenValue}${SEPARATOR}${sig}`;

    // write encoded token image.
    const resultImage = await encodeImageData(tmpImage, finalTokenValue, output);
    await fs.unlink(tmpImage);
    return resultImage;
}

async function decodeImage(filepath) {
    const encodedData = await decodeImageData(filepath);
    const imageHash = await extractImageHash(filepath);
    const nonce = await extractImageNonce(filepath);
    const sigmark = await extractImageSignature(filepath);

    if (!encodedData) {
        throw new Error('No encoded data was located. The provided file is not a valid token.');
    }

    const [header, id, hash, sig] = encodedData.split(SEPARATOR);
    const headerData = header.split(':');
    const type = headerData[0];
    const grants = headerData[1].split(',').map(i => i.trim());
    const [path, platformName] = id.split('@');
    const platform = platforms[platformName];
    const claims = buildTokenClaims([header, id, hash]);

    const imageSigMsg = buildImageMessage({
        nonce, platform: platformName, path
    });

    const sigMsg = `${nonce}${SEPARATOR}${claims}`;

    const sigAddress = platform.recoverAddress(sig, sigMsg);
    const sigmarkAddress = platform.recoverAddress(sigmark, imageSigMsg);

    return {
        id,
        type,
        platform: platformName,
        grants,
        claims,
        expectedImageHash: hash,
        imageHash,
        nonce,
        sig,
        sigAddress,
        sigmark,
        sigmarkAddress
    };
}

async function verifyImage(filepath, addr) {
    const data = _.isString(filepath) ? await decodeImage(filepath) : filepath;

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
    decodeImage,
    verifyImage
};