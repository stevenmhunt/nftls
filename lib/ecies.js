// originally derived from https://github.com/tibetty/ecies-lite
// copied and modified to remove "with" for strict mode

const crypto = require('crypto');

const config = {
    curveName: 'secp256k1',
    cipherAlgorithm: 'aes-256-cbc',
    hmacAlgorithm: 'sha256',
    ivSize: 16,
    cipherKeyGen: (bytes) => bytes.slice(0, 32),
    hmacKeyGen: (bytes) => bytes.slice(16),
};

/**
 * Config the default parameters for ecies-lite
 * @param curveName: string | object - the elliptic curve to use
 * @param cipherAlgorithm?: string - the cipher algorithm to use
 * @param hmacAlgorithm?: string - the hmac algorithm to use
 * @param ivSize?: number - the size (in bytes) of initialization vector (for cipher)
 * @param cipherKeyGen?: (Buffer) -> Buffer - the cipher key generator
 * @param hmacKeyGen?: (Buffer) -> Buffer - the hmac key generator
 * @return none
 */
exports.config = (curveName, cipherAlgorithm, hmacAlgorithm, ivSize, cipherKeyGen, hmacKeyGen) => {
    if (typeof curveName === 'string') {
        config.curveName = curveName || config.curveName;
        config.cipherAlgorithm = cipherAlgorithm || config.cipherAlgorithm;
        config.hmacAlgorithm = hmacAlgorithm || config.hmacAlgorithm;
        config.ivSize = ivSize || config.ivSize;
        config.cipherKeyGen = cipherKeyGen || config.cipherKeyGen;
        config.hmacKeyGen = hmacKeyGen || config.hmacKeyGen;
    } else if (curveName instanceof Object) {
        Object.assign(config, curveName);
    }
};

/**
 * Encrypt a message using the recepient's public key
 * @param pk: Buffer - The recipient's public key
 * @param msg: Buffer - The message to encrypt
 * @param opts?: the same structure as the config object
 * @return {epk: Buffer, iv: Buffer, ct: Buffer, mac: Buffer}
 */
exports.encrypt = (pk, msg, opts) => {
    // eslint-disable-next-line no-param-reassign
    opts = { ...config, ...(opts || {}) };
    const ecdh = crypto.createECDH(opts.curveName);
    if (opts.esk) {
        ecdh.setPrivateKey(opts.esk);
    } else {
        ecdh.generateKeys();
    }

    const ephemPublicKey = ecdh.getPublicKey(null, opts.compressEpk ? 'compressed' : 'uncompressed');
    const hash = crypto.createHash('sha256').update(ecdh.computeSecret(pk)).digest();
    const cipherKey = opts.cipherKeyGen(hash);
    const macKey = opts.hmacKeyGen(hash);
    const iv = opts.iv || crypto.randomBytes(config.ivSize);
    const cipher = crypto.createCipheriv(opts.cipherAlgorithm, cipherKey, iv);
    let ciphertext = cipher.update(msg);
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    const mac = crypto.createHmac(opts.hmacAlgorithm, macKey)
        .update(Buffer.concat([ephemPublicKey, iv, ciphertext]))
        .digest();
    return {
        iv: iv.toString('hex'),
        ephemPublicKey: ephemPublicKey.toString('hex'),
        ciphertext: ciphertext.toString('hex'),
        mac: mac.toString('hex'),
    };
};

/**
 * Decrypt a message in ecies-lite defined format using the recipient's private key
 * @param sk: Buffer - the recepient's private key
 * @param body: ecies-lite structured object
 * @param opts?: the same structure as the config object
 * @return Buffer - the plain text decrypted from the Ecies-lite body
 * @throws when mac value is unmatched, it an error
 */
exports.decrypt = (sk, body, opts) => {
    // eslint-disable-next-line no-param-reassign
    opts = { ...config, ...(opts || {}) };
    const ecdh = crypto.createECDH(opts.curveName);
    ecdh.setPrivateKey(sk);
    const {
        ephemPublicKey: epks, iv: ivs, ciphertext: cts, mac: ms,
    } = body;
    const [ephemPublicKey, iv, ciphertext, mac] = [epks, ivs, cts, ms].map((i) => Buffer.from(i, 'hex'));
    const hash = crypto.createHash('sha256').update(ecdh.computeSecret(ephemPublicKey)).digest();
    const cipherKey = opts.cipherKeyGen(hash);
    const macKey = opts.hmacKeyGen(hash);
    const expectedMac = crypto.createHmac(opts.hmacAlgorithm, macKey)
        .update(Buffer.concat([ephemPublicKey, iv, ciphertext]))
        .digest();
    if (expectedMac.compare(mac) !== 0 || mac.compare(expectedMac) !== 0) {
        throw new Error('Corrupted Ecies-lite body: unmatched authentication code');
    }
    const decipher = crypto.createDecipheriv(opts.cipherAlgorithm, cipherKey, iv);
    const pt = decipher.update(ciphertext);
    return Buffer.concat([pt, decipher.final()]);
};
