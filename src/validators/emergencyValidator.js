const Joi = require('joi');

const createContactSchema = Joi.object({
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  relationship: Joi.string().trim().required(),
  priority: Joi.number().integer().min(1).max(3).default(1)
});

const updateContactSchema = Joi.object({
  name: Joi.string().trim(),
  phone: Joi.string().trim(),
  relationship: Joi.string().trim(),
  priority: Joi.number().integer().min(1).max(3)
}).min(1);

const updateSettingsSchema = Joi.object({
  autoAlert: Joi.boolean(),
  triggerThreshold: Joi.number().integer().min(1).max(10),
  alertMessage: Joi.string().max(500)
}).min(1);

module.exports = { createContactSchema, updateContactSchema, updateSettingsSchema };