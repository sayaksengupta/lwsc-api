const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  source: { type: String, enum: ['rss', 'internal'], required: true, index: true },
  externalId: { type: String, required: true }, // RSS: guid, Internal: _id
  title: { type: String, required: true },
  excerpt: { type: String, default: null },
  url: { type: String, required: true },
  publishedAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

articleSchema.index({ source: 1, externalId: 1 }, { unique: true });
articleSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('Article', articleSchema);