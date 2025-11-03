const PainLog = require('../models/PainLog');
const MoodLog = require('../models/MoodLog');
const HydrationLog = require('../models/HydrationLog');
const MedicationIntake = require('../models/MedicationIntake');

/**
 * GET /analytics/comparison
 */
const comparison = async (req, res) => {
  const { from, to, metrics } = req.query;
  const start = new Date(from);
  const end = new Date(to);
  const userId = req.user._id;

  const metricList = metrics
    ? metrics.split(',').map(m => m.trim().toLowerCase())
    : ['pain', 'mood', 'hydration', 'medicationadherence'];

  // Fetch all data in parallel
  const [painLogs, moodLogs, hydrationLogs, intakes] = await Promise.all([
    PainLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    MoodLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    HydrationLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    MedicationIntake.find({ userId, dateTime: { $gte: start, $lte: end } }).lean()
  ]);

  // Initialize daily buckets
  const days = {};
  let current = new Date(start);
  while (current <= end) {
    const dayStr = current.toISOString().split('T')[0];
    days[dayStr] = {
      pain: { count: 0, sum: 0 },
      mood: { count: 0, sum: 0 },
      hydration: 0,
      adherence: { taken: 0, total: 0 }
    };
    current.setDate(current.getDate() + 1);
  }

  // Aggregate pain
  painLogs.forEach(log => {
    const day = log.date.toISOString().split('T')[0];
    if (days[day]) {
      days[day].pain.count++;
      days[day].pain.sum += log.intensity;
    }
  });

  // Aggregate mood
  moodLogs.forEach(log => {
    const day = log.date.toISOString().split('T')[0];
    if (days[day]) {
      days[day].mood.count++;
      days[day].mood.sum += log.intensity;
    }
  });

  // Aggregate hydration
  hydrationLogs.forEach(log => {
    const day = log.date.toISOString().split('T')[0];
    if (days[day]) {
      days[day].hydration += log.amountOz;
    }
  });

  // Aggregate medication
  intakes.forEach(i => {
    const day = i.dateTime.toISOString().split('T')[0];
    if (days[day]) {
      days[day].adherence.total++;
      if (i.status === 'Taken') days[day].adherence.taken++;
    }
  });

  // Build response
  const result = {};

  if (metricList.includes('pain')) {
    result.painByDay = Object.entries(days).map(([date, data]) => ({
      date,
      count: data.pain.count,
      avgIntensity: data.pain.count > 0 ? Number((data.pain.sum / data.pain.count).toFixed(2)) : 0
    }));
  }

  if (metricList.includes('mood')) {
    result.moodByDay = Object.entries(days).map(([date, data]) => ({
      date,
      avgIntensity: data.mood.count > 0 ? Number((data.mood.sum / data.mood.count).toFixed(2)) : 0
    }));
  }

  if (metricList.includes('hydration')) {
    result.hydrationByDay = Object.entries(days).map(([date, data]) => ({
      date,
      totalOz: Number(data.hydration.toFixed(1))
    }));
  }

  if (metricList.includes('medicationadherence')) {
    result.adherenceByDay = Object.entries(days).map(([date, data]) => {
      const { taken, total } = data.adherence;
      const value = total > 0 ? (taken / total >= 0.8 ? 1 : 0) : 0;
      return { date, value };
    });
  }

  res.json(result);
};

/**
 * GET /analytics/correlations
 */
const correlations = async (req, res) => {
  const { from, to, x, y } = req.query;
  const start = new Date(from);
  const end = new Date(to);
  const userId = req.user._id;

  const [painLogs, moodLogs, hydrationLogs] = await Promise.all([
    PainLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    MoodLog.find({ userId, date: { $gte: start, $lte: end } }).lean(),
    HydrationLog.find({ userId, date: { $gte: start, $lte: end } }).lean()
  ]);

  // Build daily data map
  const daily = {};
  let current = new Date(start);
  while (current <= end) {
    const dayStr = current.toISOString().split('T')[0];
    daily[dayStr] = { x: 0, y: 0 };
    current.setDate(current.getDate() + 1);
  }

  // Populate X
  if (x === 'pain') {
    painLogs.forEach(log => {
      const day = log.date.toISOString().split('T')[0];
      if (daily[day]) daily[day].x = Math.max(daily[day].x, log.intensity);
    });
  } else if (x === 'mood') {
    moodLogs.forEach(log => {
      const day = log.date.toISOString().split('T')[0];
      if (daily[day]) daily[day].x = Math.max(daily[day].x, log.intensity);
    });
  } else if (x === 'hydration') {
    hydrationLogs.forEach(log => {
      const day = log.date.toISOString().split('T')[0];
      if (daily[day]) daily[day].x += log.amountOz;
    });
  }

  // Populate Y
  if (y === 'pain') {
    painLogs.forEach(log => {
      const day = log.date.toISOString().split('T')[0];
      if (daily[day]) daily[day].y = Math.max(daily[day].y, log.intensity);
    });
  } else if (y === 'mood') {
    moodLogs.forEach(log => {
      const day = log.date.toISOString().split('T')[0];
      if (daily[day]) daily[day].y = Math.max(daily[day].y, log.intensity);
    });
  } else if (y === 'hydration') {
    hydrationLogs.forEach(log => {
      const day = log.date.toISOString().split('T')[0];
      if (daily[day]) daily[day].y += log.amountOz;
    });
  }

  // Convert to points array
  const points = Object.entries(daily).map(([date, { x, y }]) => ({
    date,
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2))
  }));

  // Pearson correlation
  const n = points.length;
  if (n === 0) {
    return res.json({ correlation: 0, points: [] });
  }

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  const correlation = denominator === 0 ? 0 : Number((numerator / denominator).toFixed(3));

  res.json({ correlation, points });
};

module.exports = { comparison, correlations };