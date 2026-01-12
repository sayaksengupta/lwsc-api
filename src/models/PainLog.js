// models/PainLog.js
const mongoose = require("mongoose");

const painLogSchema = new mongoose.Schema({
  // This is the ACTIVE profile (childId or parent _id)
  userId: {
    type: String, // ← CHANGED FROM ObjectId TO String
    required: true,
    index: true,
  },

  // Optional: Keep track of who actually logged it (parent)
  loggedByParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },

  date: { type: Date, required: true },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PainLocation",
    required: true,
  },
  moodEmoji: { type: String, default: null },
  painType: { type: String, required: true, trim: true },
  intensity: { type: Number, min: 0, max: 10, required: true },
  notes: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Composite indexes for performance
painLogSchema.index({ userId: 1, date: -1 }); // Most important: list + stats
painLogSchema.index({ loggedByParent: 1, date: -1 }); // For parent audit views
painLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("PainLog", painLogSchema);
