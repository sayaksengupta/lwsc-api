// services/achievementService.js
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const PainLog = require('../models/PainLog');
const MoodLog = require('../models/MoodLog');
const HydrationLog = require('../models/HydrationLog');
const MedicationIntake = require('../models/MedicationIntake');
const { awardLogCoins } = require('./coinService');

const getLogCount = async (userId, days = null, type = 'any') => {
  const match = { userId };
  if (days) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - days + 1);
    match.dateTime = { $gte: start };
  }

  const models = {
    pain: PainLog,
    mood: MoodLog,
    hydration: HydrationLog,
    medication: MedicationIntake,
    any: null
  };

  if (type !== 'any') {
    return await models[type].countDocuments(match);
  }

  // Count all logs
  const counts = await Promise.all(
    Object.values(models).filter(Boolean).map(Model => Model.countDocuments(match))
  );
  return counts.reduce((a, b) => a + b, 0);
};

const checkStreak = async (userId, logType = 'any') => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  const models = {
    pain: PainLog,
    mood: MoodLog,
    hydration: HydrationLog,
    medication: MedicationIntake
  };

  while (true) {
    const dayStart = new Date(checkDate);
    const dayEnd = new Date(checkDate);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    let hasLog = false;

    if (logType === 'any') {
      const results = await Promise.all(
        Object.values(models).map(Model => Model.exists({
          userId,
          dateTime: { $gte: dayStart, $lt: dayEnd }
        }))
      );
      hasLog = results.some(Boolean);
    } else {
      hasLog = await models[logType].exists({
        userId,
        dateTime: { $gte: dayStart, $lt: dayEnd }
      });
    }

    if (!hasLog) break;
    streak++;
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  return streak;
};

const checkAndAwardAchievements = async (userId) => {
  const activeAchievements = await Achievement.find({ isActive: true }).lean();

  const awarded = await UserAchievement.find({ userId }).select('achievementId');

  const alreadyAwardedIds = new Set(awarded.map(a => a.achievementId.toString()));

  const newAwards = [];

  for (const ach of activeAchievements) {
    if (alreadyAwardedIds.has(ach._id.toString())) continue;

    let conditionMet = false;

    switch (ach.criteria.type) {
      case 'streak':
        const streak = await checkStreak(userId, ach.criteria.logType);
        if (streak >= ach.criteria.value) conditionMet = true;
        break;

      case 'total_logs':
        const total = await getLogCount(userId, null, ach.criteria.logType);
        if (total >= ach.criteria.value) conditionMet = true;
        break;

      case 'monthly_logs':
        const monthly = await getLogCount(userId, 30, ach.criteria.logType);
        if (monthly >= ach.criteria.value) conditionMet = true;
        break;
    }

    if (conditionMet) {
      // Award it!
      await UserAchievement.create({
        userId,
        achievementId: ach._id
      });

      // Give coins
      if (ach.rewardCoins > 0) {
        await awardLogCoins(userId, 'achievement'); // or custom reason
        // Or directly: User.findByIdAndUpdate(userId, { $inc: { coins: ach.rewardCoins } })
      }

      newAwards.push({
        achievement: ach,
        message: `Unlocked: ${ach.title}!`
      });
    }
  }

  return newAwards;
};

module.exports = { checkAndAwardAchievements, checkStreak };