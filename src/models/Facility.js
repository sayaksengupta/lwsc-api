const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true } // [lng, lat]
}, { _id: false });

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: {
    type: String,
    enum: ['Hospital', 'Clinic', 'Pharmacy', 'Lab', 'Center', 'Other'],
    required: true
  },
  address: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipcode: { type: String, index: true },
  mobile: { type: String, default: null },
  email: { type: String, default: null },
  website: { type: String, default: null },
  location: { type: locationSchema, required: true, index: '2dsphere' },
  rating: { type: Number, min: 0, max: 5, default: null },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

facilitySchema.index({ name: 'text', address: 'text', description: 'text' });

module.exports = mongoose.model('Facility', facilitySchema);