const { drawSignatureMark, extractSignatureMark } = require('eth-signature-mark');
const platforms = require('../platforms');
    const { SEPARATOR, generateNonce, buildTokenClaims } = require('../common');

const DOMAIN_TOKEN_CLAIM = "NFTLS Item Token: VerifyIdentity";

async function createSignature(token, key) {
    const platformName = token.id.split('@')[1];
    const platform = platforms[platformName];
    const nonce = generateNonce();

    // build initial encoded token string.
    const tokenValue = buildTokenClaims([DOMAIN_TOKEN_CLAIM, token.id, ...(token.claims || [])]);

    // get signature.
    const prefix = token.nonce ? `${nonce}${SEPARATOR}` : '';
    const signature = platform.signMessage(key, `${prefix}${tokenValue}`);

    return {
        signature, nonce: token.nonce ? nonce : undefined
    };
}

async function verifySignature({ id, claims }, signature, addr, nonce = null) {
    const platformName = id.split('@')[1];
    const platform = platforms[platformName];
    const expectedToken = buildTokenClaims([DOMAIN_TOKEN_CLAIM, id, ...(claims || [])]);
    const prefix = nonce ? `${nonce}${SEPARATOR}` : '';
    const expectedMsg = `${prefix}${expectedToken}`;
    const sigAddress = platform.recoverAddress(signature, expectedMsg);

    if (!addr) {
        return sigAddress;
    }

    if (sigAddress !== addr.toLowerCase()) {
        return `Invalid signature address.`;
    }

    return 'Verified';
}

async function createImage(token, key, output) {
    const { signature, nonce } = await createSignature(token, key);
    await drawSignatureMark(output, signature, ...(token.coordinates || []));
    return { signature, nonce };
}

async function verifyImage({ id, claims, coordinates }, filepath, nonce = null, addr = null) {
    const signature = await extractSignatureMark(filepath, ...(coordinates || []));
    return verifySignature({ id, claims }, signature, nonce, addr);
}

module.exports = {
    createSignature,
    verifySignature,
    createImage,
    verifyImage
};