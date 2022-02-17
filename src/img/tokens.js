const path = require('path');
const _ = require('lodash');
const Jimp = require('jimp');
const fs = require('fs-extra');

const { drawSignatureMark, extractSignatureMark } = require('eth-signature-mark');
const { fillWithColor } = require('./utils');
const { keccak256 } = require('../utils');
const { encodeImageData, decodeImageData } = require('./steganography');

const TOKEN_WIDTH = 512;
const TOKEN_HEIGHT = 512;
const HEADER_SIZE = 42;
const PADDING = 6;

const MARK_X = 6;
const MARK_Y = 6;
const MARK_W = 6;
const MARK_H = 6;

const HEADER_FONT = path.join(__dirname, '../../fonts', 'OpenSansCondensed-Bold.fnt');

/**
 * Renders an image to use for a domain token.
 * It includes specific information about the domain.
 * @param {*} token The token to render from.
 * @param {*} output The output file.
 */
async function renderDomainTokenImage(token, output) {
    let image = await Jimp.read(token.image);
    const font = await Jimp.loadFont(HEADER_FONT);
    const codeColor = token.code.toString(16).padStart(8, '0');
    const headerColor = codeColor.substring(2);

    // draw header and footer.
    image = image.quality(100)
        .scan(0, 0, TOKEN_WIDTH, HEADER_SIZE, fillWithColor(headerColor))
        .scan(0, TOKEN_HEIGHT - HEADER_SIZE, TOKEN_WIDTH, HEADER_SIZE, fillWithColor(headerColor));

    // write text to the top.
    image = image.print(font, 0, 0, {
        text: `${token.path}${token.version ? ` (${token.version})` : ''}`,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    }, TOKEN_WIDTH, HEADER_SIZE);
    image = image.print(font, 0, 0, {
        text: token.platform,
        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    }, TOKEN_WIDTH - PADDING, HEADER_SIZE);

    // write text to the bottom.
    if (token.code) {
        image = image.print(font, 0, TOKEN_HEIGHT - HEADER_SIZE, {
            text: `${token.code}`,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
        }, TOKEN_WIDTH, HEADER_SIZE);
    }
    image = image.print(font, PADDING, TOKEN_HEIGHT - HEADER_SIZE, {
        text: 'NFTLS.IO',
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    }, TOKEN_WIDTH, HEADER_SIZE);

    image = await drawSignatureMark(image, token.signature, MARK_X, MARK_Y, MARK_W, MARK_H);

    // write code as color.
    image = image.scan(
        TOKEN_WIDTH - HEADER_SIZE + PADDING,
        TOKEN_HEIGHT - HEADER_SIZE + PADDING,
        HEADER_SIZE - PADDING * 2,
        HEADER_SIZE - PADDING * 2,
        fillWithColor(codeColor),
    );

    await image.writeAsync(output);
    return output;
}

/**
 * Calculates the baseline image hash of the target.
 * @param {*} filepath The target image file.
 * @param {*} useTempFile Whether or not to use a temporary file to avoid modifying the image.
 * @returns {Promise<string>} The resultant baseline hash.
 */
async function extractImageHash(filepath) {
    let data;
    if (_.isBuffer(filepath)) {
        data = filepath;
    } else if (filepath.length >= 1024) {
        data = Buffer.from(filepath, 'base64');
    } else { data = await fs.readFile(filepath); }
    const image = await encodeImageData(data, null);
    const result = keccak256(image);
    return result;
}

/**
 * Extracts the signature mark from the domain token image.
 */
async function extractImageSignature(filepath) {
    const image = await Jimp.read(filepath);
    return extractSignatureMark(image, MARK_X, MARK_Y, MARK_W, MARK_H);
}

/**
 * Extracts the security code from the domain token image.
 */
async function extractImageCode(filepath) {
    const image = await Jimp.read(filepath);
    return image.getPixelColor(TOKEN_WIDTH - PADDING * 2, TOKEN_HEIGHT - PADDING * 2);
}

module.exports = {
    encodeImageData,
    decodeImageData,
    renderDomainTokenImage,
    extractImageHash,
    extractImageCode,
    extractImageSignature,
};
