const PainLog = require('../models/PainLog');
const MoodLog = require('../models/MoodLog');
const HydrationLog = require('../models/HydrationLog');
const MedicationIntake = require('../models/MedicationIntake');
const MedicationSchedule = require('../models/MedicationSchedule');
const Event = require('../models/Event');
const CoinTransaction = require('../models/CoinTransaction');
const User = require('../models/User');

const getOverview = async (req, res) => {
  const userId = req.user._id;
  const { period = '7d' } = req.query;

  const now = new Date();
  let startDate;

  switch (period) {
    case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
    case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    default: startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Parallel data fetch
  const [
    painLogs,
    moodLogs,
    hydrationLogs,
    intakes,
    schedules,
    events,
    transactions,
    user
  ] = await Promise.all([
    PainLog.find({ userId, date: { $gte: startDate } }).lean(),
    MoodLog.find({ userId, date: { $gte: startDate } }).lean(),
    HydrationLog.find({ userId, date: { $gte: startDate } }).lean(),
    MedicationIntake.find({ userId, dateTime: { $gte: startDate } }).lean(),
    MedicationSchedule.find({ userId, status: 'Active' }).lean(),
    Event.find({ userId, date: { $gte: startDate } }).lean(),
    CoinTransaction.find({ userId, date: { $gte: startDate } }).lean(),
    User.findById(userId).select('hydrationGoalOz coins').lean()
  ]);

  // 1. Pain Trend
  const painByDay = aggregateByDay(painLogs, 'date', 'intensity', 'avg');
  const painTrend = Object.keys(painByDay).map(date => ({
    date,
    avgIntensity: painByDay[date].avg
  })).sort((a, b) => a.date.localeCompare(b.date));

  // 2. Mood Trend
  const moodByDay = aggregateByDay(moodLogs, 'date', 'intensity', 'avg');
  const moodTrend = Object.keys(moodByDay).map(date => ({
    date,
    avgIntensity: moodByDay[date].avg
  })).sort((a, b) => a.date.localeCompare(b.date));

  // 3. Hydration Trend
  const hydrationByDay = aggregateByDay(hydrationLogs, 'date', 'amountOz', 'sum');
  const hydrationTrend = Object.keys(hydrationByDay).map(date => ({
    date,
    totalOz: hydrationByDay[date].sum
  })).sort((a, b) => a.date.localeCompare(b.date));

  // 4. Medication Adherence Trend
  const adherenceByDay = {};
  const current = new Date(startDate);
  while (current <= now) {
    const dayStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay() || 7;

    const expected = schedules
      .filter(s => s.daysOfWeek.includes(dayOfWeek))
      .reduce((sum, s) => sum + Object.values(s.times).filter(t => t).length, 0);

    const taken = intakes.filter(i =>
      i.dateTime.toISOString().split('T')[0] === dayStr &&
      i.status === 'Taken'
    ).length;

    adherenceByDay[dayStr] = {
      expected,
      taken,
      percentage: expected > 0 ? Math.round((taken / expected) * 100) : 100
    };
    current.setDate(current.getDate() + 1);
  }

  const adherenceTrend = Object.keys(adherenceByDay).map(date => ({
    date,
    percentage: adherenceByDay[date].percentage
  })).sort((a, b) => a.date.localeCompare(b.date));

  // 5. Activity Summary
  const activitySummary = {
    painEntries: painLogs.length,
    moodEntries: moodLogs.length,
    hydrationEntries: hydrationLogs.length,
    medicationDoses: intakes.length,
    events: events.length
  };

  // 6. Coin Activity
  const earned = transactions
    .filter(t => t.type === 'EARN')
    .reduce((s, t) => s + t.amount, 0);
  const spent = transactions
    .filter(t => t.type === 'SPEND')
    .reduce((s, t) => s + t.amount, 0);

  const coinActivity = {
    currentBalance: user.coins,
    earned,
    spent,
    net: earned - spent
  };

  // 7. Upcoming Events (next 3)
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => a.date - b.date)
    .slice(0, 3)
    .map(e => ({
      title: e.title,
      date: e.date.toISOString().split('T')[0],
      time: e.startTime || 'All Day',
      type: e.type
    }));

  res.json({
    period,
    painTrend,
    moodTrend,
    hydrationTrend,
    adherenceTrend,
    activitySummary,
    coinActivity,
    upcomingEvents
  });
};

// Helper: Aggregate by day
const aggregateByDay = (logs, dateField, valueField, aggType) => {
  return logs.reduce((acc, log) => {
    const day = new Date(log[dateField]).toISOString().split('T')[0];
    if (!acc[day]) acc[day] = { sum: 0, count: 0 };
    acc[day].sum += log[valueField];
    acc[day].count++;
    return acc;
  }, {});
};

// Apply avg/sum
Object.keys(aggregateByDay).forEach(day => {
  const data = aggregateByDay[day];
  data.avg = data.count > 0 ? Number((data.sum / data.count).toFixed(1)) : 0;
  data.sum = Number(data.sum.toFixed(1));
});

module.exports = { getOverview };