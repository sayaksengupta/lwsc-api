// controllers/moodController.js
const MoodLog = require("../models/MoodLog");
const { getPagination } = require("../utils/pagination");
const { awardLogCoins } = require("../services/coinService");
const { checkAndAwardAchievements } = require("../services/achievementService");

// ── MIDDLEWARE MUST SET: req.activeUserId (from getActiveUserId) ──

const list = async (req, res) => {
  const { from, to, page, pageSize } = req.query;
  const { skip, limit } = getPagination(page, pageSize);
  const filter = { userId: req.activeUserId }; // ← CHILD OR PARENT

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const [data, total] = await Promise.all([
    MoodLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    MoodLog.countDocuments(filter),
  ]);

  res.json({
    data,
    meta: { page: parseInt(page || 1), pageSize: limit, total },
  });
};

const create = async (req, res) => {
  const log = await MoodLog.create({
    ...req.body,
    userId: req.activeUserId,
    loggedByParent: req.user._id,
  });

  // Award coins → returns real result
  const coinResult = await awardLogCoins(req.activeUserId, "mood");

  // Check achievements
  const newAchievements = await checkAndAwardAchievements(req.activeUserId);

  // Dynamic coins & message
  const coinsEarned = coinResult?.coins || 0;
  const alreadyHadCoinsToday = coinResult?.alreadyAwarded || false;

  let message = "Mood log saved";
  if (newAchievements.length > 0) {
    const titles = newAchievements.map((a) => a.title).join(", ");
    message = `Fantastic! ${titles} unlocked!`;
  }
  if (coinsEarned > 0) {
    message += ` +${coinsEarned} coins!`;
  } else if (alreadyHadCoinsToday) {
    message += " (Coins already earned today)";
  }

  res.status(201).json({
    log,
    achievements: newAchievements,
    coinsEarned,
    alreadyHadCoinsToday,
    message,
  });
};

const update = async (req, res) => {
  const { id } = req.params;

  const log = await MoodLog.findOneAndUpdate(
    { _id: id, userId: req.activeUserId }, // ← Only own/child logs
    req.body,
    { new: true, runValidators: true }
  );

  if (!log) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Mood log not found or access denied",
      },
    });
  }

  res.json(log);
};

const remove = async (req, res) => {
  const { id } = req.params;

  const result = await MoodLog.deleteOne({
    _id: id,
    userId: req.activeUserId, // ← Only delete own/child logs
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Log not found or access denied" },
    });
  }

  res.json({ success: true, message: "Mood log deleted" });
};

const stats = async (req, res) => {
  const { from, to } = req.query;
  const activeUserId = req.activeUserId;

  const logs = await MoodLog.find({
    userId: activeUserId,
    date: { $gte: new Date(from), $lte: new Date(to) },
  }).lean();

  const totalIntensity = logs.reduce((sum, log) => sum + log.intensity, 0);
  const avgIntensity = logs.length
    ? Number((totalIntensity / logs.length).toFixed(2))
    : 0;

  const distribution = Object.values(
    logs.reduce((acc, log) => {
      acc[log.emoji] = (acc[log.emoji] || 0) + 1;
      return acc;
    }, {})
  ).map((count, i, arr) => {
    const emoji = Object.keys(
      arr.reduce(
        (a, v, i) => (v === count ? { ...a, emoji: Object.keys(arr)[i] } : a),
        {}
      )
    );
    return { emoji: emoji[0], count };
  });

  const byDayMap = logs.reduce((acc, log) => {
    const day = log.date.toISOString().split("T")[0];
    if (!acc[day]) acc[day] = { sum: 0, count: 0 };
    acc[day].sum += log.intensity;
    acc[day].count++;
    return acc;
  }, {});

  const byDay = Object.entries(byDayMap)
    .map(([date, { sum, count }]) => ({
      date,
      avgIntensity: count > 0 ? Number((sum / count).toFixed(2)) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    summary: {
      totalLogs: logs.length,
      period: { from, to },
      activeProfile: req.activeProfileType === "child" ? "child" : "parent",
    },
    avgIntensity,
    distribution,
    byDay,
  });
};

module.exports = { list, create, update, remove, stats };
