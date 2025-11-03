const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  relationship: { type: String, required: true, trim: true },
  priority: { type: Number, min: 1, max: 3, default: 1 }, // 1 = Primary, 2 = Secondary, 3 = Tertiary
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

emergencyContactSchema.index({ userId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);