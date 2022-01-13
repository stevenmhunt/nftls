const _ = require('lodash');
const Joi = require('joi');
const { certTypeMapping } = require('../constants');
const { platforms, identity } = require('./common');

module.exports = (platform) => Joi.object({
    id: Joi.string(),
    type: Joi.string().valid(..._.values(certTypeMapping)).required(),
    subject: identity(platform).required(),
    email: Joi.string().email().required(),
    imageHash: Joi.string().length(64).hex().required(),
    dateRequested: Joi.date().iso().required(),
    signature: platforms[platform].signature().required(),
    requestSignature: platforms[platform].signature().required(),
    forwardSignature: platforms[platform].signature(),
    requestAddress: platforms[platform].address().required(),
    forwardAddress: platforms[platform].address(),
    issuer: identity(platform).required(),
    issuerEmail: Joi.string().email().required(),
    dateIssued: Joi.date().iso().required(),
    serialNumber: Joi.string().length(32).hex().required(),
    signatureAddress: platforms[platform].address(),
    requestSignatureAddress: platforms[platform].address(),
    forwardSignatureAddress: platforms[platform].address(),
});
