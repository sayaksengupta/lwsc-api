const mongoose = require('mongoose');

const hydrationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true, index: true },
  amountOz: { type: Number, required: true, min: 0.1 },
  type: { type: String, enum: ['glass', 'bottle', 'custom'], required: true },
  quantity: { type: Number, default: null }, // e.g., 2 glasses
  note: { type: String, default: null, trim: true }
}, { timestamps: true });

hydrationLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('HydrationLog', hydrationLogSchema);