const Joi = require('joi');

const redeemSchema = Joi.object({
  amount: Joi.number().integer().min(1).required(),
  rewardCode: Joi.string().required()
});

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(50)
});

module.exports = { redeemSchema, listQuerySchema };