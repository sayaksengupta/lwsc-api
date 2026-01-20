const Joi = require('joi');

const searchQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  radius: Joi.number().min(1).max(100).default(10), // km
  type: Joi.string().valid('Hospital', 'Clinic', 'Pharmacy', 'Lab', 'Center', 'Other'),
  query: Joi.string().trim(),
  zipcode: Joi.string().trim(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20)
});

const createFacilitySchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().trim().allow(''),
  type: Joi.string().valid('Hospital', 'Clinic', 'Pharmacy', 'Lab', 'Center', 'Other').required(),
  mobile: Joi.string().trim().allow(null, ''),
  email: Joi.string().email().trim().allow(null, ''),
  website: Joi.string().uri().trim().allow(null, ''),
  address: Joi.string().required().trim(),
  state: Joi.string().required().trim(),
  country: Joi.string().required().trim(),
  zipcode: Joi.string().trim().allow(''),
  coordinates: Joi.array().items(Joi.number()).length(2).required() // [lng, lat]
});

module.exports = { searchQuerySchema, createFacilitySchema };