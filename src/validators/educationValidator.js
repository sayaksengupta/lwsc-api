const Joi = require('joi');

const listQuerySchema = Joi.object({
  source: Joi.string().valid('rss', 'internal'),
  query: Joi.string().trim(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20)
});

const createBookmarkSchema = Joi.object({
  articleId: Joi.string().required()
});

module.exports = { listQuerySchema, createBookmarkSchema };