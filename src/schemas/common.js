const Joi = require('joi');

const platforms = {
    eth: {
        name: () => Joi.string().regex(/^[*a-z^\d]?[a-z0-9.-]*[#]?[0-9]*[@][a-z]*$/),
        domain: () => Joi.string().regex(/^[*a-z^\d]?[a-z0-9.-]*$/),
        token: () => Joi.string().regex(/^0x[a-fA-F0-9]{40}[#]0?x?[a-fA-F0-9]*$/),
        address: () => Joi.string().regex(/^0x[a-fA-F0-9]{40}$/),
        signature: () => Joi.string().regex(/^0x[a-f0-9]{130}$/),
    },
};

const identity = (platform) => Joi.object({
    name: platforms[platform].name().required(),
    organization: Joi.string().required(),
    division: Joi.string(),
    country: Joi.string().length(2).required(),
    province: Joi.string(),
    state: Joi.string(),
    city: Joi.string().required(),
});

module.exports = {
    identity,
    platforms,
};
