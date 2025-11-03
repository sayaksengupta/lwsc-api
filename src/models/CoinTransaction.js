const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['EARN', 'SPEND'], required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

coinTransactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);