const mongoose = require("mongoose");

const userAchievementSchema = new mongoose.Schema({
  // Now stores childId string OR parent _id
  userId: { type: String, required: true, index: true },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Achievement",
    required: true,
  },
  awardedAt: { type: Date, default: Date.now },
});

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
module.exports = mongoose.model("UserAchievement", userAchievementSchema);
