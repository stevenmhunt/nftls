const Joi = require('joi');
const { certTypes } = require('../constants');
const { platforms, identity, hash } = require('./common');

module.exports = (platform) => Joi.object({
    id: platforms(platform).token(),
    type: Joi.string().valid(...certTypes).required(),
    version: Joi.number(),
    subject: identity(platform).required(),
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    imageHash: hash(),
    dateRequested: Joi.date().timestamp('unix').required(),
    data: Joi.string(),
    contractNonce: Joi.number(),
    signature: platforms(platform).signature().required(),
    forSignature: platforms(platform).signature(),
    requestAddress: platforms(platform).address().required(),
    forAddress: platforms(platform).address(),
    issuer: identity(platform).required(),
    issuerEmail: Joi.string().email({ tlds: { allow: false } }).required(),
    dateIssued: Joi.date().timestamp('unix').required(),
    serialNumber: Joi.string().length(32).hex().required(),
    signatureAddress: platforms(platform).address(),
    forSignatureAddress: platforms(platform).address(),
});
