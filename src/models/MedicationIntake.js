// models/MedicationIntake.js
const mongoose = require("mongoose");

const medicationIntakeSchema = new mongoose.Schema(
  {
    // ACTIVE profile (childId string or parent _id)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Who actually took/recorded it (parent)
    loggedByParent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicationSchedule",
      required: true,
    },
    dateTime: { type: Date, required: true },
    label: {
      type: String,
      enum: ["Morning", "Afternoon", "Evening", "BedTime", "Custom"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Taken", "Late", "Skipped"],
      required: true,
    },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

// Indexes for speed
medicationIntakeSchema.index({ userId: 1, dateTime: -1 });
medicationIntakeSchema.index({ scheduleId: 1 });
medicationIntakeSchema.index({ loggedByParent: 1, dateTime: -1 });

module.exports = mongoose.model("MedicationIntake", medicationIntakeSchema);
