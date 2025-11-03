const mongoose = require('mongoose');

const sharedMoodLogSchema = new mongoose.Schema({
  moodLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'MoodLog', required: true },
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: null },
  deliveredAt: { type: Date, default: Date.now }
}, { timestamps: true });

sharedMoodLogSchema.index({ moodLogId: 1, sharedWith: 1 });

module.exports = mongoose.model('SharedMoodLog', sharedMoodLogSchema);