const Joi = require('joi');

const sharePainSchema = Joi.object({
  logId: Joi.string().required(),
  connectionIds: Joi.array().items(Joi.string()).min(1).required(),
  message: Joi.string().allow(null, '').max(500)
});

const shareMoodSchema = Joi.object({
  logId: Joi.string().required(),
  connectionIds: Joi.array().items(Joi.string()).min(1).required(),
  message: Joi.string().allow(null, '').max(500)
});

module.exports = { sharePainSchema, shareMoodSchema };