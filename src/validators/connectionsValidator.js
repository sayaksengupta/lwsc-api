const Joi = require('joi');

const phoneSchema = Joi.string()
  .trim()
  .pattern(/^\+?[1-9]\d{1,14}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid phone number format. Use international format like +923001234567',
    'string.empty': 'Phone number is required',
  });

const contactSchema = Joi.object({
  phone: phoneSchema,
  name: Joi.string().trim().min(2).max(50).optional(),
  relationship: Joi.string().trim().allow('', null).optional(),
});

const createSchema = Joi.object({
  contacts: Joi.array()
    .items(contactSchema)
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one contact is required',
      'array.max': 'Maximum 100 contacts allowed at once',
      'any.required': 'contacts array is required',
    }),
});

const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  phone: phoneSchema,
  relationship: Joi.string().trim().allow('', null),
}).min(1);

module.exports = { createSchema, updateSchema };