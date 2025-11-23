const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  icon: { type: String, required: true }, // e.g. "flame", "smiling-face", "droplet"
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);