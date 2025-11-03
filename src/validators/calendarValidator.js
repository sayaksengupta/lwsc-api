const Joi = require('joi');

const createSchema = Joi.object({
  title: Joi.string().required(),
  type: Joi.string().valid('mood', 'pain', 'hydration', 'medication', 'appointment', 'custom').required(),
  date: Joi.date().iso().required(),
  location: Joi.string().allow(null, ''),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null, ''),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null, ''),
  repeat: Joi.object({
    weekly: Joi.boolean(),
    monthly: Joi.boolean()
  }).default({}),
  color: Joi.string().allow(null, ''),
  reminder: Joi.string().allow(null, '')
});

const updateSchema = createSchema.fork(['title', 'type', 'date'], f => f.optional()).min(1);

const listQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  type: Joi.string().valid('mood', 'pain', 'hydration', 'medication', 'appointment', 'custom')
});

module.exports = { createSchema, updateSchema, listQuerySchema };