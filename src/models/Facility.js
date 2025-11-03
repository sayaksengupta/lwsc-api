const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true } // [lng, lat]
}, { _id: false });

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['Hospital', 'Clinic', 'Pharmacy', 'Lab', 'Other'],
    required: true
  },
  address: { type: String, required: true },
  phone: { type: String, default: null },
  location: { type: locationSchema, required: true, index: '2dsphere' },
  rating: { type: Number, min: 0, max: 5, default: null },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

facilitySchema.index({ name: 'text', address: 'text' });

module.exports = mongoose.model('Facility', facilitySchema);