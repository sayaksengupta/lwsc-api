const Joi = require('joi');

const comparisonSchema = Joi.object({
  from: Joi.date().iso().required(),
  to: Joi.date().iso().required(),
  metrics: Joi.string()
    .pattern(/^([a-zA-Z]+)(,[a-zA-Z]+)*$/)
    .default('pain,mood,hydration,medicationAdherence')
});

const correlationsSchema = Joi.object({
  from: Joi.date().iso().required(),
  to: Joi.date().iso().required(),
  x: Joi.string().valid('pain', 'mood', 'hydration').required(),
  y: Joi.string().valid('pain', 'mood', 'hydration').required()
});

module.exports = { comparisonSchema, correlationsSchema };