const crypto = require('crypto');

function fillWithColor(color) {
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const a = color.length >= 8 ? parseInt(color.substring(6, 8), 16) : 255;
    return function (x, y, idx) {
        this.bitmap.data[idx + 0] = r;
        this.bitmap.data[idx + 1] = g;
        this.bitmap.data[idx + 2] = b;
        this.bitmap.data[idx + 3] = a;
    }
}

function sha256(val) {
    return crypto.createHash('sha256').update(val).digest().toString('hex');
}

module.exports = {
    fillWithColor,
    sha256
};
