const Joi = require('joi');

const createLogSchema = Joi.object({
  date: Joi.date().iso().required(),
  amountOz: Joi.number().min(0.1).required(),
  type: Joi.string().valid('glass', 'bottle', 'custom').required(),
  quantity: Joi.number().integer().min(1).allow(null),
  note: Joi.string().trim().allow(null, '').max(200)
});

const updateLogSchema = Joi.object({
  amountOz: Joi.number().min(0.1),
  type: Joi.string().valid('glass', 'bottle', 'custom'),
  quantity: Joi.number().integer().min(1).allow(null),
  note: Joi.string().trim().allow(null, '').max(200)
}).min(1);

const goalSchema = Joi.object({
  goalOz: Joi.number().min(1).required()
});

const summaryQuerySchema = Joi.object({
  date: Joi.date().iso().required()
});

const listQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(50)
});

module.exports = {
  createLogSchema,
  updateLogSchema,
  goalSchema,
  summaryQuerySchema,
  listQuerySchema
};