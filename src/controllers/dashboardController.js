// controllers/dashboardController.js
const PainLog = require("../models/PainLog");
const MoodLog = require("../models/MoodLog");
const HydrationLog = require("../models/HydrationLog");
const MedicationIntake = require("../models/MedicationIntake");
const MedicationSchedule = require("../models/MedicationSchedule");
const Event = require("../models/Event");
const CoinTransaction = require("../models/CoinTransaction");
const User = require("../models/User");

const getOverview = async (req, res) => {
  const activeUserId = req.activeUserId; // ← Child or Parent
  const parentId = req.user._id; // ← Real parent (for hydration goal)
  const { period = "7d" } = req.query;

  const now = new Date();
  let startDate;

  switch (period) {
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Fetch parent for hydration goal (shared)
  const parent = await User.findById(parentId).select("hydrationGoalOz").lean();

  // Parallel data fetch — using activeUserId
  const [
    painLogs,
    moodLogs,
    hydrationLogs,
    intakes,
    schedules,
    events,
    transactions,
  ] = await Promise.all([
    PainLog.find({ userId: activeUserId, date: { $gte: startDate } }).lean(),
    MoodLog.find({ userId: activeUserId, date: { $gte: startDate } }).lean(),
    HydrationLog.find({
      userId: activeUserId,
      date: { $gte: startDate },
    }).lean(),
    MedicationIntake.find({
      userId: activeUserId,
      dateTime: { $gte: startDate },
    }).lean(),
    MedicationSchedule.find({ userId: activeUserId, status: "Active" }).lean(),
    Event.find({ userId: activeUserId, date: { $gte: startDate } }).lean(),
    CoinTransaction.find({
      userId: activeUserId,
      date: { $gte: startDate },
    }).lean(),
  ]);

  // Helper: Aggregate by day
  const aggregateByDay = (logs, dateField, valueField, aggType) => {
    return logs.reduce((acc, log) => {
      const day = new Date(log[dateField]).toISOString().split("T")[0];
      if (!acc[day]) acc[day] = { sum: 0, count: 0 };
      acc[day].sum += log[valueField];
      acc[day].count++;
      return acc;
    }, {});
  };

  // 1. Pain Trend
  const painByDay = aggregateByDay(painLogs, "date", "intensity", "avg");
  const painTrend = Object.keys(painByDay)
    .map((date) => ({
      date,
      avgIntensity:
        painByDay[date].count > 0
          ? Number((painByDay[date].sum / painByDay[date].count).toFixed(1))
          : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 2. Mood Trend
  const moodByDay = aggregateByDay(moodLogs, "date", "intensity", "avg");
  const moodTrend = Object.keys(moodByDay)
    .map((date) => ({
      date,
      avgIntensity:
        moodByDay[date].count > 0
          ? Number((moodByDay[date].sum / moodByDay[date].count).toFixed(1))
          : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. Hydration Trend
  const hydrationByDay = aggregateByDay(
    hydrationLogs,
    "date",
    "amountOz",
    "sum"
  );
  const hydrationTrend = Object.keys(hydrationByDay)
    .map((date) => ({
      date,
      totalOz: Number(hydrationByDay[date].sum.toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 4. Medication Adherence Trend
  const adherenceByDay = {};
  const current = new Date(startDate);
  while (current <= now) {
    const dayStr = current.toISOString().split("T")[0];
    const dayOfWeek = current.getDay() || 7;

    const expected = schedules
      .filter((s) => s.daysOfWeek.includes(dayOfWeek))
      .reduce(
        (sum, s) => sum + Object.values(s.times).filter((t) => t).length,
        0
      );

    const taken = intakes.filter(
      (i) =>
        i.dateTime.toISOString().split("T")[0] === dayStr &&
        i.status === "Taken"
    ).length;

    adherenceByDay[dayStr] = {
      expected,
      taken,
      percentage: expected > 0 ? Math.round((taken / expected) * 100) : 100,
    };
    current.setDate(current.getDate() + 1);
  }

  const adherenceTrend = Object.keys(adherenceByDay)
    .map((date) => ({
      date,
      percentage: adherenceByDay[date].percentage,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 5. Activity Summary
  const activitySummary = {
    painEntries: painLogs.length,
    moodEntries: moodLogs.length,
    hydrationEntries: hydrationLogs.length,
    medicationDoses: intakes.length,
    events: events.length,
  };

  // 6. Coin Activity — now per child!
  const earned = transactions
    .filter((t) => t.type === "EARN")
    .reduce((s, t) => s + t.amount, 0);
  const spent = transactions
    .filter((t) => t.type === "SPEND")
    .reduce((s, t) => s + t.amount, 0);

  // Get active profile coins (parent or child)
  const activeProfile = req.user.getActiveProfile();
  const currentBalance = activeProfile.coins;

  const coinActivity = {
    currentBalance,
    earned,
    spent,
    net: earned - spent,
  };

  // 7. Upcoming Events (next 3)
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
    .map((e) => ({
      title: e.title,
      date: e.date.toISOString().split("T")[0],
      time: e.startTime || "All Day",
      type: e.type,
    }));

  res.json({
    profile: {
      name: activeProfile.name,
      type: activeProfile.type,
      isChild: activeProfile.type === "child",
    },
    period,
    painTrend,
    moodTrend,
    hydrationTrend,
    adherenceTrend,
    activitySummary,
    coinActivity,
    upcomingEvents,
    hydrationGoalOz: parent?.hydrationGoalOz || 64,
  });
};

module.exports = { getOverview };
