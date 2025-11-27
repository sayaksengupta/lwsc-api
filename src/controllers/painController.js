const PainLog = require('../models/PainLog');
const { getPagination } = require('../utils/pagination');
const { awardLogCoins } = require('../services/coinService');
const { checkAndAwardAchievements } = require('../services/achievementService');

const list = async (req, res) => {
  const { from, to, location, type, page, pageSize } = req.query;
  const { skip, limit } = getPagination(page, pageSize);

  const filter = { userId: req.user._id };
  if (from) filter.date = { ...filter.date, $gte: new Date(from) };
  if (to) filter.date = { ...filter.date, $lte: new Date(to) };
  if (location) filter.location = new RegExp(location, 'i');
  if (type) filter.painType = new RegExp(type, 'i');

  const [data, total] = await Promise.all([
    PainLog.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PainLog.countDocuments(filter)
  ]);

  res.json({
    data,
    meta: { page: parseInt(page), pageSize: limit, total }
  });
};

const create = async (req, res) => {
  const log = await PainLog.create({
    ...req.body,
    userId: req.user._id
  });
  await awardLogCoins(req.user._id, 'pain');
  // CHECK ACHIEVEMENTS
  const newAchievements = await checkAndAwardAchievements(req.user._id);
  res.status(201).json({
    log,
    achievements: newAchievements, // send to frontend → show confetti!
    message: newAchievements.length > 0 
      ? `Great job! You unlocked ${newAchievements.length} achievement(s)!` 
      : 'Log saved'
  });
};

const update = async (req, res) => {
  const { id } = req.params;
  const log = await PainLog.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!log) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pain log not found' } });
  }

  res.json(log);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const result = await PainLog.deleteOne({ _id: id, userId: req.user._id });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  }

  res.json({ success: true });
};

const stats = async (req, res) => {
  const { from, to } = req.query;
  const userId = req.user._id;

  const dateFilter = {
    userId,
    date: { $gte: new Date(from), $lte: new Date(to) }
  };

  const logs = await PainLog.find(dateFilter).lean();

  // By Day
  const byDayMap = logs.reduce((acc, log) => {
    const day = log.date.toISOString().split('T')[0];
    if (!acc[day]) acc[day] = { count: 0, sum: 0 };
    acc[day].count++;
    acc[day].sum += log.intensity;
    return acc;
  }, {});

  const byDay = Object.entries(byDayMap)
    .map(([date, { count, sum }]) => ({
      date,
      count,
      avgIntensity: Number((sum / count).toFixed(2))
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // By Location
  const byLocation = Object.entries(
    logs.reduce((acc, log) => {
      acc[log.location] = (acc[log.location] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);

  // Top Pain Types
  const topPainTypes = Object.entries(
    logs.reduce((acc, log) => {
      acc[log.painType] = (acc[log.painType] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  res.json({ byDay, byLocation, topPainTypes });
};

module.exports = { list, create, update, remove, stats };