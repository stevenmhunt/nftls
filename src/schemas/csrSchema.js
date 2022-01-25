const Joi = require('joi');
const { csrTypes } = require('../constants');
const { platforms, identity, hash } = require('./common');

module.exports = (platform) => Joi.object({
    type: Joi.string().valid(...csrTypes).required(),
    version: Joi.number(),
    subject: identity(platform).required(),
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    imageHash: hash(),
    dateRequested: Joi.date().timestamp('unix').required(),
    data: Joi.string(),
    contractNonce: Joi.number(),
    signature: platforms[platform].signature().required(),
    requestSignature: platforms[platform].signature().required(),
    forSignature: platforms[platform].signature(),
    requestAddress: platforms[platform].address().required(),
    forAddress: platforms[platform].address(),
});
