const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    criteria: {
      type: {
        type: String,
        enum: [
          "streak",
          "total_logs",
          "monthly_logs",
          "pain_logs",
          "medication_streak",
        ],
        required: true,
      },
      value: { type: Number, required: true },
      logType: {
        type: String,
        enum: ["any", "pain", "mood", "hydration", "medication"],
        default: "any",
      },
    },

    rewardCoins: { type: Number, default: 50 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Achievement", achievementSchema);
