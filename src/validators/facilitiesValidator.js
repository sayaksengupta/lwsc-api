const Joi = require('joi');

const searchQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(1).max(100).default(10), // km
  type: Joi.string().valid('Hospital', 'Clinic', 'Pharmacy', 'Lab', 'Other'),
  query: Joi.string().trim(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(50).default(20)
});

module.exports = { searchQuerySchema };