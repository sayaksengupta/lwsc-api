// models/CoinTransaction.js
const mongoose = require("mongoose");

const coinTransactionSchema = new mongoose.Schema(
  {
    // ACTIVE profile: childId (string) OR parent _id (string)
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // Optional: Who performed the action (parent)
    // Useful for audit: "Mom gave Ayesha 50 bonus coins"
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    type: {
      type: String,
      enum: ["EARN", "SPEND"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      // Examples:
      // "Logged hydration
      // Logged medication
      // Redeemed badge: Super Star
      // Bonus from mom
    },

    // Optional metadata (for future features)
    metadata: {
      logType: { type: String }, // 'hydration', 'pain', 'medication'
      badgeId: { type: mongoose.Schema.Types.ObjectId, ref: "Badge" },
      achievementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Achievement",
      },
    },

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Optimized indexes for performance
coinTransactionSchema.index({ userId: 1, date: -1 }); // List transactions
coinTransactionSchema.index({ userId: 1, type: 1, date: -1 }); // Analytics
coinTransactionSchema.index({ performedBy: 1, date: -1 }); // Parent audit
coinTransactionSchema.index({ userId: 1, reason: 1, date: -1 }); // Prevent duplicates if needed

module.exports = mongoose.model("CoinTransaction", coinTransactionSchema);
