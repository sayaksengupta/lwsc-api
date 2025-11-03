const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  savedAt: { type: Date, default: Date.now }
}, { timestamps: true });

bookmarkSchema.index({ userId: 1, articleId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);