// models/MoodLog.js
const mongoose = require("mongoose");

const moodLogSchema = new mongoose.Schema(
  {
    // ACTIVE profile (childId or parent _id)
    userId: {
      type: String, // ← CHANGED FROM ObjectId TO String
      required: true,
      index: true,
    },

    // Optional: Track who logged it (parent)
    loggedByParent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    date: { type: Date, required: true },
    emoji: { type: String, required: true },
    intensity: { type: Number, min: 1, max: 10, required: true },
    desc: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },

    // Add timestamps for consistency
  },
  { timestamps: true }
);

// Composite indexes for performance
moodLogSchema.index({ userId: 1, date: -1 }); // List + stats
moodLogSchema.index({ loggedByParent: 1, date: -1 }); // Parent audit view

module.exports = mongoose.model("MoodLog", moodLogSchema);
