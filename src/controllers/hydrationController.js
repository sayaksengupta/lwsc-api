// controllers/hydrationController.js
const HydrationLog = require("../models/HydrationLog");
const User = require("../models/User");
const { getPagination } = require("../utils/pagination");
const { awardLogCoins } = require("../services/coinService");
const { checkAndAwardAchievements } = require("../services/achievementService");

const getSummary = async (req, res) => {
  const { date } = req.query;
  const activeUserId = req.activeUserId;
  const targetDate = new Date(date);
  const start = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const [logs, user] = await Promise.all([
    HydrationLog.find({
      userId: activeUserId,
      date: { $gte: start, $lt: end },
    })
      .sort({ date: 1 })
      .lean(),

    // Parent's goal applies to all children
    User.findById(req.user._id).select("hydrationGoalOz"),
  ]);

  const totalOz = logs.reduce((sum, log) => sum + log.amountOz, 0);

  const byType = { glassOz: 0, bottleOz: 0, customOz: 0 };
  logs.forEach((log) => {
    if (log.type === "glass") byType.glassOz += log.amountOz;
    else if (log.type === "bottle") byType.bottleOz += log.amountOz;
    else byType.customOz += log.amountOz;
  });

  res.json({
    totalOz: Number(totalOz.toFixed(1)),
    goalOz: user?.hydrationGoalOz || 64,
    percentage: user?.hydrationGoalOz
      ? Number(((totalOz / user.hydrationGoalOz) * 100).toFixed(1))
      : null,
    byType,
    entries: logs.map((log) => ({
      id: log._id,
      date: log.date,
      amountOz: log.amountOz,
      type: log.type,
      quantity: log.quantity,
      note: log.note,
    })),
  });
};

const listLogs = async (req, res) => {
  const { from, to, page, pageSize } = req.query;
  const { skip, limit } = getPagination(page, pageSize);
  const filter = { userId: req.activeUserId };

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const [data, total] = await Promise.all([
    HydrationLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    HydrationLog.countDocuments(filter),
  ]);

  res.json({
    data,
    meta: { page: parseInt(page || 1), pageSize: limit, total },
  });
};

const createLog = async (req, res) => {
  const { date, amountOz, type, quantity, note } = req.body;

  const log = await HydrationLog.create({
    userId: req.activeUserId,
    loggedByParent: req.user._id,
    date: date || new Date(),
    amountOz,
    type,
    quantity,
    note,
  });

  await awardLogCoins(req.activeUserId, "hydration");
  const newAchievements = await checkAndAwardAchievements(req.activeUserId);

  res.status(201).json({
    log,
    achievements: newAchievements,
    message:
      newAchievements.length > 0
        ? `Amazing! ${newAchievements.length} new achievement(s)!`
        : "Hydration logged!",
    coinsEarned: 10,
  });
};

const updateLog = async (req, res) => {
  const { id } = req.params;

  const log = await HydrationLog.findOneAndUpdate(
    { _id: id, userId: req.activeUserId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!log) {
    return res
      .status(404)
      .json({
        error: { code: "NOT_FOUND", message: "Log not found or access denied" },
      });
  }

  res.json(log);
};

const deleteLog = async (req, res) => {
  const { id } = req.params;

  const result = await HydrationLog.deleteOne({
    _id: id,
    userId: req.activeUserId,
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: "NOT_FOUND" } });
  }

  res.json({ success: true, message: "Hydration log deleted" });
};

const getGoal = async (req, res) => {
  const user = await User.findById(req.user._id).select("hydrationGoalOz");
  res.json({ goalOz: user.hydrationGoalOz || 64 });
};

const setGoal = async (req, res) => {
  const { goalOz } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { hydrationGoalOz: goalOz },
    { new: true }
  ).select("hydrationGoalOz");

  res.json({ goalOz: user.hydrationGoalOz });
};

module.exports = {
  getSummary,
  listLogs,
  createLog,
  updateLog,
  deleteLog,
  getGoal,
  setGoal,
};
