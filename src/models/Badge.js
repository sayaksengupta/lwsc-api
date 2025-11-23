const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },        // e.g. "Focus Badge"
  icon: { type: String, required: true },                  // e.g. "trophy"
  description: { type: String, default: '' },
  coinCost: { type: Number, required: true, min: 1 },        // e.g. 500
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);