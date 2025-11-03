const MoodLog = require('../models/MoodLog');
const { getPagination } = require('../utils/pagination');

const list = async (req, res) => {
  const { from, to, page, pageSize } = req.query;
  const { skip, limit } = getPagination(page, pageSize);
  const filter = { userId: req.user._id };
  if (from) filter.date = { ...filter.date, $gte: new Date(from) };
  if (to) filter.date = { ...filter.date, $lte: new Date(to) };

  const [data, total] = await Promise.all([
    MoodLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    MoodLog.countDocuments(filter)
  ]);

  res.json({ data, meta: { page: parseInt(page), pageSize: limit, total } });
};

const create = async (req, res) => {
  const log = await MoodLog.create({ ...req.body, userId: req.user._id });
  res.status(201).json(log);
};

const update = async (req, res) => {
  const { id } = req.params;
  const log = await MoodLog.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    req.body,
    { new: true }
  );
  if (!log) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  res.json(log);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const result = await MoodLog.deleteOne({ _id: id, userId: req.user._id });
  if (result.deletedCount === 0) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  res.json({ success: true });
};

const stats = async (req, res) => {
  const { from, to } = req.query;
  const userId = req.user._id;

  const logs = await MoodLog.find({
    userId,
    date: { $gte: new Date(from), $lte: new Date(to) }
  }).lean();

  const totalIntensity = logs.reduce((sum, log) => sum + log.intensity, 0);
  const avgIntensity = logs.length ? Number((totalIntensity / logs.length).toFixed(2)) : 0;

  const distribution = Object.values(
    logs.reduce((acc, log) => {
      acc[log.emoji] = (acc[log.emoji] || 0) + 1;
      return acc;
    }, {})
  ).map((count, i, arr) => {
    const emoji = Object.keys(arr.reduce((a, v, i) => (v === count ? { ...a, emoji: Object.keys(arr)[i] } : a), {}));
    return { emoji: emoji[0], count };
  });

  const byDayMap = logs.reduce((acc, log) => {
    const day = log.date.toISOString().split('T')[0];
    if (!acc[day]) acc[day] = { sum: 0, count: 0 };
    acc[day].sum += log.intensity;
    acc[day].count++;
    return acc;
  }, {});

  const byDay = Object.entries(byDayMap)
    .map(([date, { sum, count }]) => ({
      date,
      avgIntensity: Number((sum / count).toFixed(2))
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({ avgIntensity, distribution, byDay });
};

module.exports = { list, create, update, remove, stats };