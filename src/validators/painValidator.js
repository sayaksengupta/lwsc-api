const Joi = require('joi');

const createSchema = Joi.object({
  date: Joi.date().iso().required(),
  location: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid location ID format'
  }),
  moodEmoji: Joi.string().allow(null, ''),
  painType: Joi.string().trim().required(),
  intensity: Joi.number().min(0).max(10).required(),
  notes: Joi.string().allow(null, '')
});

const updateSchema = Joi.object({
  date: Joi.date().iso(),
  location: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid location ID format'
  }),
  moodEmoji: Joi.string().allow(null, ''),
  painType: Joi.string().trim(),
  intensity: Joi.number().min(0).max(10),
  notes: Joi.string().allow(null, '')
}).min(1);

const listQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  location: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'Invalid location ID format'
  }),
  type: Joi.string().trim(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(50)
});

const statsQuerySchema = Joi.object({
  from: Joi.date().iso().required(),
  to: Joi.date().iso().required()
});

module.exports = {
  createSchema,
  updateSchema,
  listQuerySchema,
  statsQuerySchema
};