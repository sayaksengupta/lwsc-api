const mongoose = require("mongoose");

const userAchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Achievement",
    required: true,
  },
  awardedAt: { type: Date, default: Date.now },
});

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

module.exports = mongoose.model("UserAchievement", userAchievementSchema);
