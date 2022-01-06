const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const Jimp = require('jimp');

const { fillWithColor } = require('./common');
const { encodeImageData, decodeImageData } = require('./steganography');
const { drawSignatureMark, extractSignatureMark } = require('eth-signature-mark');

const TOKEN_WIDTH = 256;
const TOKEN_HEIGHT = 256;
const HEADER_SIZE = 21;
const PADDING = 3;

const MARK_X = 3;
const MARK_Y = 3;
const MARK_W = 3;
const MARK_H = 3;

const HEADER_FONT = 'FONT_SANS_16_WHITE';

async function buildTokenImage(token) {
    let image = await Jimp.read(token.image);
    const resultImage = path.join('./bin', `~${path.basename(token.image)}`);
    const font = await Jimp.loadFont(Jimp[HEADER_FONT]);
    const nonceColor = token.nonce.toString(16).padEnd(8, 'f');
    const headerColor = nonceColor.substring(2);
    
    // draw header and footer.
    image = image.quality(100)
        .scan(0, 0, TOKEN_WIDTH, HEADER_SIZE, fillWithColor(headerColor))
        .scan(0, TOKEN_HEIGHT - HEADER_SIZE, TOKEN_WIDTH, HEADER_SIZE, fillWithColor(headerColor));

    // write text to the top.
    image = image.print(font, 0, 0, {
            text: token.path,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, TOKEN_WIDTH, HEADER_SIZE);
    image = image.print(font, 0, 0, {
            text: token.platform,
            alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, TOKEN_WIDTH - PADDING, HEADER_SIZE);

    // write text to the bottom.
    image = image.print(font, 0, TOKEN_HEIGHT - HEADER_SIZE, {
            text: `${token.nonce}`,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, TOKEN_WIDTH, HEADER_SIZE)
        .print(font, PADDING, TOKEN_HEIGHT - HEADER_SIZE, {
            text: 'NFTLS',
            alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, TOKEN_WIDTH, HEADER_SIZE);

    image = await drawSignatureMark(image, token.imageSig, MARK_X, MARK_Y, MARK_W, MARK_H);

    // write nonce as color.
    image = image.scan(TOKEN_WIDTH - HEADER_SIZE + PADDING,
        TOKEN_HEIGHT - HEADER_SIZE + PADDING,
        HEADER_SIZE - PADDING * 2,
        HEADER_SIZE - PADDING * 2,
        fillWithColor(nonceColor));

    await image.writeAsync(resultImage);
    return resultImage;
}

async function extractImageHash(filepath, useTempFile = true) {
    const tmpfile = useTempFile ? path.join(os.tmpdir(), path.basename(filepath)) : filepath;
    if (useTempFile) {
        await fs.copyFile(filepath, tmpfile);
    }
    await encodeImageData(tmpfile, null, false);
    const image = await fs.readFile(tmpfile);
    if (useTempFile) {
        await fs.unlink(tmpfile);
    }
    return crypto.createHash('sha256').update(image).digest().toString('hex');
}

async function extractImageSignature(filepath) {
    const image = await Jimp.read(filepath);
    return extractSignatureMark(image, MARK_X, MARK_Y, MARK_W, MARK_H);
}

async function extractImageNonce(filepath) {
    const image = await Jimp.read(filepath);
    return image.getPixelColor(TOKEN_WIDTH - PADDING * 2, TOKEN_HEIGHT - PADDING * 2);
}

module.exports = {
    encodeImageData,
    decodeImageData,
    buildTokenImage,
    extractImageHash,
    extractImageNonce,
    extractImageSignature
};
