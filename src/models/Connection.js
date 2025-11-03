const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  relationship: { type: String, default: null, trim: true },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

connectionSchema.index({ userId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);