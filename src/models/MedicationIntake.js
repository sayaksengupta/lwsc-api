const mongoose = require('mongoose');

const medicationIntakeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicationSchedule', required: true },
  dateTime: { type: Date, required: true },
  label: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'BedTime', 'Custom'],
    required: true
  },
  status: {
    type: String,
    enum: ['Taken', 'Late', 'Skipped'],
    required: true
  },
  notes: { type: String, default: null }
}, { timestamps: true });

medicationIntakeSchema.index({ userId: 1, dateTime: -1 });
medicationIntakeSchema.index({ scheduleId: 1 });

module.exports = mongoose.model('MedicationIntake', medicationIntakeSchema);