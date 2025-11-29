// models/HydrationLog.js
const mongoose = require("mongoose");

const hydrationLogSchema = new mongoose.Schema(
  {
    // ACTIVE profile: childId (string) or parent _id (string)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Optional: Who actually pressed the button (parent)
    loggedByParent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    date: { type: Date, required: true, index: true },
    amountOz: { type: Number, required: true, min: 0.1 },
    type: {
      type: String,
      enum: ["glass", "bottle", "custom"],
      required: true,
    },
    quantity: { type: Number, default: null }, // e.g., 2 glasses
    note: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

// Indexes for speed
hydrationLogSchema.index({ userId: 1, date: -1 }); // List + stats
hydrationLogSchema.index({ loggedByParent: 1, date: -1 }); // Parent audit

module.exports = mongoose.model("HydrationLog", hydrationLogSchema);
