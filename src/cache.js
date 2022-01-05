const fs = require('fs-extra');

function utf8ToHex(str) {
    return Array.from(str).map(c => 
      c.charCodeAt(0) < 128 ? c.charCodeAt(0).toString(16) : 
      encodeURIComponent(c).replace(/\%/g,'').toLowerCase()
    ).join('');
}

function hexToUtf8(hex) {
    return decodeURIComponent('%' + hex.match(/.{1,2}/g).join('%'));
}

async function setItem(id, file) {
}

async function getItem(id, fn) {
}

module.exports = {
    getItem,
    setItem
};
