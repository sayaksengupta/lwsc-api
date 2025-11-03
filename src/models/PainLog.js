const mongoose = require('mongoose');

const painLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  moodEmoji: { type: String, default: null },
  painType: { type: String, required: true, trim: true },
  intensity: { type: Number, min: 0, max: 10, required: true },
  notes: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
});

painLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('PainLog', painLogSchema);