const Joi = require('joi');

const createSchema = Joi.object({
  date: Joi.date().iso().required(),
  emoji: Joi.string().required(),
  intensity: Joi.number().min(1).max(10).required(),
  desc: Joi.string().allow(null, '')
});

const updateSchema = createSchema.fork(['date', 'emoji', 'intensity'], f => f.optional()).min(1);

const listQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(50)
});

const statsQuerySchema = Joi.object({
  from: Joi.date().iso().required(),
  to: Joi.date().iso().required()
});

module.exports = { createSchema, updateSchema, listQuerySchema, statsQuerySchema };