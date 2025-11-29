// services/achievementService.js
const Achievement = require("../models/Achievement");
const UserAchievement = require("../models/UserAchievement");
const User = require("../models/User");
const PainLog = require("../models/PainLog");
const MoodLog = require("../models/MoodLog");
const HydrationLog = require("../models/HydrationLog");
const MedicationIntake = require("../models/MedicationIntake");
const { awardLogCoins } = require("./coinService");

const getLogCount = async (activeUserId, days = null, type = "any") => {
  const match = { userId: activeUserId };
  if (days) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - days + 1);
    match.date = { $gte: start };
  }

  const models = {
    pain: PainLog,
    mood: MoodLog,
    hydration: HydrationLog,
    medication: MedicationIntake,
  };

  if (type !== "any" && models[type]) {
    return await models[type].countDocuments(match);
  }

  const counts = await Promise.all(
    Object.values(models).map((Model) => Model.countDocuments(match))
  );
  return counts.reduce((a, b) => a + b, 0);
};

const checkStreak = async (activeUserId, logType = "any") => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  const models = {
    pain: PainLog,
    mood: MoodLog,
    hydration: HydrationLog,
    medication: MedicationIntake,
  };

  while (true) {
    const dayStart = new Date(checkDate);
    const dayEnd = new Date(checkDate);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    let hasLog = false;

    if (logType === "any") {
      const results = await Promise.all(
        Object.values(models).map((Model) =>
          Model.exists({
            userId: activeUserId,
            date: { $gte: dayStart, $lt: dayEnd },
          })
        )
      );
      hasLog = results.some(Boolean);
    } else if (models[logType]) {
      hasLog = await models[logType].exists({
        userId: activeUserId,
        date: { $gte: dayStart, $lt: dayEnd },
      });
    }

    if (!hasLog) break;
    streak++;
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  return streak;
};

const checkAndAwardAchievements = async (activeUserId, performedBy = null) => {
  const achievements = await Achievement.find({ isActive: true }).lean();
  const awarded = await UserAchievement.find({ userId: activeUserId })
    .select("achievementId")
    .lean();

  const awardedIds = new Set(awarded.map((a) => a.achievementId.toString()));
  const newAwards = [];

  for (const ach of achievements) {
    if (awardedIds.has(ach._id.toString())) continue;

    let met = false;

    switch (ach.criteria.type) {
      case "streak":
        const streak = await checkStreak(activeUserId, ach.criteria.logType);
        if (streak >= ach.criteria.value) met = true;
        break;

      case "total_logs":
        const total = await getLogCount(
          activeUserId,
          null,
          ach.criteria.logType
        );
        if (total >= ach.criteria.value) met = true;
        break;

      case "monthly_logs":
        const monthly = await getLogCount(
          activeUserId,
          30,
          ach.criteria.logType
        );
        if (monthly >= ach.criteria.value) met = true;
        break;
    }

    if (met) {
      await UserAchievement.create({
        userId: activeUserId,
        achievementId: ach._id,
      });

      if (ach.rewardCoins > 0) {
        await awardLogCoins(activeUserId, "achievement", performedBy);
      }

      newAwards.push({
        _id: ach._id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        rewardCoins: ach.rewardCoins,
        message: `Unlocked: ${ach.title}!`,
      });
    }
  }

  return newAwards;
};

module.exports = { checkAndAwardAchievements, checkStreak, getLogCount };
