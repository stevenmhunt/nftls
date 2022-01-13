const _ = require('lodash');
const Joi = require('joi');
const { csrTypeMapping } = require('../constants');
const { platforms, identity } = require('./common');

module.exports = (platform) => Joi.object({
    type: Joi.string().valid(..._.values(csrTypeMapping)).required(),
    subject: identity(platform).required(),
    email: Joi.string().email().required(),
    imageHash: Joi.string().length(64).hex().required(),
    dateRequested: Joi.date().iso(),
    data: Joi.string(),
    signature: platforms[platform].signature().required(),
    requestSignature: platforms[platform].signature().required(),
    forSignature: platforms[platform].signature(),
    requestAddress: platforms[platform].address().required(),
    forAddress: platforms[platform].address(),
});
