/* eslint-disable no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */
const _ = require('lodash');
const toStream = require('tostream');
const fs = require('fs');
const { PNG } = require('pngjs3');

module.exports = function pngStash(filename, cb_) {
    const cb = _.once(cb_);

    function parsed() {
        const img = this;
        const { data } = img;
        const length = data.length >> 3;

        function get(idx) {
            if (idx < 0 || idx >= length) throw new Error(`Index out of bounds (0-${length}).`);

            idx <<= 3;
            let val = 0;
            for (let i = 0; i < 8; i++) val = (val << 1) + (data[idx + i] & 1);
            return val;
        }

        function set(idx, val) {
            if (idx < 0 || idx >= length) throw new Error(`Index out of bounds (0-${length}).`);

            idx <<= 3;
            for (let i = 7; i >= 0; i--) {
                const bit = val & 1;
                val >>= 1;
                data[idx + i] = (data[idx + i] & 0xfe) + bit;
            }
        }

        function save(cb_) {
            const cb = _.once(cb_);
            if (Buffer.isBuffer(filename)) {
                const bufs = [];
                img.adjustGamma();
                img.pack()
                    .on('data', (d) => { bufs.push(d); })
                    .on('error', (err) => { cb(err || 'file save error'); })
                    .on('end', () => { cb(null, Buffer.concat(bufs)); });
            } else {
                img.adjustGamma();
                img.pack().pipe(fs.createWriteStream(filename))
                    .on('error', (err) => { cb(err || 'file save error'); })
                    .on('finish', () => { cb(); });
            }
        }

        function write(writeData, offset, writeLength) {
            if (!Buffer.isBuffer(writeData)) writeData = Buffer.from(writeData);

            offset = offset || 0;
            if (writeLength === undefined) writeLength = writeData.length;

            if (offset < 0) throw new Error('Negative offset.');
            if (offset + writeLength > length) {
                throw new Error(`Offset + write length exceeds bounds (${offset
                } + ${writeLength} > ${length}).`);
            }

            for (let i = 0; i < writeLength; i++) set(offset + i, writeData[i]);
        }

        function read(offset, readLength) {
            offset = offset || 0;
            if (readLength === undefined) readLength = length - offset;

            if (readLength + offset > length) {
                throw new Error(`Read length + offset exceeds bounds (${readLength
                } + ${offset} > ${length}).`);
            }

            const b = Buffer.alloc(readLength);
            for (let i = 0; i < readLength; i++) b[i] = get(offset + i);

            return b;
        }

        const accessor = {
            length,
            getByte: get,
            setByte: set,
            write,
            read,
            save,
        };

        cb(null, accessor);
    }

    let stream;
    if (Buffer.isBuffer(filename)) {
        stream = toStream(filename);
    } else {
        stream = fs.createReadStream(filename);
    }

    stream
        .on('error', (err) => { cb(err || 'file read error'); })
        .pipe(new PNG())
        .on('parsed', parsed)
        .on('error', (err) => { cb(err || 'png parse error'); });
};
