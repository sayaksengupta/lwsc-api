const mongoose = require('mongoose');

const repeatSchema = new mongoose.Schema({
  weekly: { type: Boolean, default: false },
  monthly: { type: Boolean, default: false }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['mood', 'pain', 'hydration', 'medication', 'appointment', 'custom'],
    required: true
  },
  date: { type: Date, required: true },
  location: { type: String, default: null },
  startTime: { type: String, default: null }, // "14:30"
  endTime: { type: String, default: null },
  repeat: { type: repeatSchema, default: {} },
  color: { type: String, default: null },
  reminder: { type: String, default: null } // "15m", "1h", etc.
}, { timestamps: true });

eventSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Event', eventSchema);