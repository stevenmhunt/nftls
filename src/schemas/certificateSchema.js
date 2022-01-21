const Joi = require('joi');
const { certTypes } = require('../constants');
const { platforms, identity } = require('./common');

module.exports = (platform) => Joi.object({
    id: platforms[platform].token(),
    type: Joi.string().valid(...certTypes).required(),
    subject: identity(platform).required(),
    email: Joi.string().email().required(),
    imageHash: Joi.string().length(64).hex(),
    dateRequested: Joi.date().timestamp('unix').required(),
    data: Joi.string(),
    contractNonce: Joi.number(),
    signature: platforms[platform].signature().required(),
    requestSignature: platforms[platform].signature().required(),
    forSignature: platforms[platform].signature(),
    requestAddress: platforms[platform].address().required(),
    forAddress: platforms[platform].address(),
    issuer: identity(platform).required(),
    issuerEmail: Joi.string().email().required(),
    dateIssued: Joi.date().timestamp('unix').required(),
    serialNumber: Joi.string().length(32).hex().required(),
    signatureAddress: platforms[platform].address(),
    requestSignatureAddress: platforms[platform].address(),
    forSignatureAddress: platforms[platform].address(),
});
