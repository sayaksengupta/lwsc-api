// validators/connectionsValidator.js
const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid phone number'
    }),
  relationship: Joi.string().trim().allow('', null)
});

const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }),
  relationship: Joi.string().trim().allow('', null)
}).min(1);

module.exports = { createSchema, updateSchema };