const Joi = require('joi');

const overviewQuerySchema = Joi.object({
  period: Joi.string().valid('24h', '7d', '30d').default('7d')
});

module.exports = { overviewQuerySchema };