const mongoose = require('mongoose');

const sharedPainLogSchema = new mongoose.Schema({
  painLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'PainLog', required: true },
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: null },
  deliveredAt: { type: Date, default: Date.now }
}, { timestamps: true });

sharedPainLogSchema.index({ painLogId: 1, sharedWith: 1 });

module.exports = mongoose.model('SharedPainLog', sharedPainLogSchema);