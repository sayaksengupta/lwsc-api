const mongoose = require("mongoose");

const userBadgeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: true,
    },
    redeemedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
module.exports = mongoose.model("UserBadge", userBadgeSchema);
