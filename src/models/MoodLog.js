const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  emoji: { type: String, required: true },
  intensity: { type: Number, min: 1, max: 10, required: true },
  desc: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

moodLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('MoodLog', moodLogSchema);