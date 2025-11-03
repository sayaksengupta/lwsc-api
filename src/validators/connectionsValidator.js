const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  relationship: Joi.string().trim().allow(null, '')
});

const updateSchema = Joi.object({
  name: Joi.string().trim(),
  phone: Joi.string().trim(),
  relationship: Joi.string().trim().allow(null, '')
}).min(1);

module.exports = { createSchema, updateSchema };