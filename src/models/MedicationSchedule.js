const mongoose = require('mongoose');

const timesSchema = new mongoose.Schema({
  morning: { type: String, default: null },
  afternoon: { type: String, default: null },
  evening: { type: String, default: null },
  bedTime: { type: String, default: null }
}, { _id: false });

const nextDoseSchema = new mongoose.Schema({
  dateTime: { type: Date },
  label: { type: String }
}, { _id: false });

const medicationScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  dose: { type: String, required: true },
  reason: { type: String, default: null },
  type: {
    type: String,
    enum: ['Capsule', 'Tablet', 'Liquid', 'Injection', 'Other'],
    required: true
  },
  times: { type: timesSchema, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, default: null },
  daysOfWeek: { type: [Number], required: true }, // 1-7
  fullWeekReminder: { type: Boolean, default: false },
  intakeTracking: { type: Boolean, default: true },
  nextDose: { type: nextDoseSchema, default: null },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Ended'],
    default: 'Active'
  }
}, { timestamps: true });

medicationScheduleSchema.index({ userId: 1, fromDate: -1 });

module.exports = mongoose.model('MedicationSchedule', medicationScheduleSchema);