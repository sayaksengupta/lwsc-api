// controllers/painLogController.js
const PainLog = require("../models/PainLog");
const { getPagination } = require("../utils/pagination");
const { awardLogCoins } = require("../services/coinService");
const { checkAndAwardAchievements } = require("../services/achievementService");

// ── MIDDLEWARE MUST SET: req.activeUserId (from getActiveUserId) ──

const list = async (req, res) => {
  const { from, to, location, type, page, pageSize } = req.query;
  const { skip, limit } = getPagination(page, pageSize);

  const filter = { userId: req.activeUserId }; // ← CHILD OR PARENT

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (location) filter.location = new RegExp(location, "i");
  if (type) filter.painType = new RegExp(type, "i");

  const [data, total] = await Promise.all([
    PainLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    PainLog.countDocuments(filter),
  ]);

  res.json({
    data,
    meta: { page: parseInt(page || 1), pageSize: limit, total },
  });
};

const create = async (req, res) => {
  const log = await PainLog.create({
    ...req.body,
    userId: req.activeUserId, // ← THIS IS THE MAGIC
    loggedByParent: req.user._id, // ← Optional: audit trail (who logged it)
  });

  // Award coins & check achievements for the ACTIVE profile
  await awardLogCoins(req.activeUserId, "pain");
  const newAchievements = await checkAndAwardAchievements(req.activeUserId);

  res.status(201).json({
    log,
    achievements: newAchievements,
    message:
      newAchievements.length > 0
        ? `Amazing! ${newAchievements.map((a) => a.title).join(", ")} unlocked!`
        : "Pain log saved",
    coinsEarned: 10,
  });
};

const update = async (req, res) => {
  const { id } = req.params;

  const log = await PainLog.findOneAndUpdate(
    { _id: id, userId: req.activeUserId }, // ← Only own or child's log
    req.body,
    { new: true, runValidators: true }
  );

  if (!log) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Pain log not found or access denied",
      },
    });
  }

  res.json(log);
};

const remove = async (req, res) => {
  const { id } = req.params;

  const result = await PainLog.deleteOne({
    _id: id,
    userId: req.activeUserId, // ← Only delete own/child logs
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Log not found or access denied" },
    });
  }

  res.json({ success: true, message: "Pain log deleted" });
};

const stats = async (req, res) => {
  const { from, to } = req.query;
  const activeUserId = req.activeUserId;

  const dateFilter = { userId: activeUserId };
  if (from || to) {
    dateFilter.date = {};
    if (from) dateFilter.date.$gte = new Date(from);
    if (to) dateFilter.date.$lte = new Date(to);
  }

  const logs = await PainLog.find(dateFilter).lean();

  // By Day (average intensity)
  const byDayMap = logs.reduce((acc, log) => {
    const day = log.date.toISOString().split("T")[0];
    if (!acc[day]) acc[day] = { count: 0, sum: 0 };
    acc[day].count++;
    acc[day].sum += log.intensity;
    return acc;
  }, {});

  const byDay = Object.entries(byDayMap)
    .map(([date, { count, sum }]) => ({
      date,
      count,
      avgIntensity: count > 0 ? Number((sum / count).toFixed(1)) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // By Location
  const byLocation = Object.entries(
    logs.reduce((acc, log) => {
      const key = log.location || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top Pain Types
  const topPainTypes = Object.entries(
    logs.reduce((acc, log) => {
      const key = log.painType || "Unspecified";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    summary: {
      totalLogs: logs.length,
      period: { from, to },
      activeProfile: req.activeProfileType === "child" ? "child" : "parent",
    },
    byDay,
    byLocation,
    topPainTypes,
  });
};

module.exports = { list, create, update, remove, stats };
