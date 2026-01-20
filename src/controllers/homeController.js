// controllers/homeController.js
const PainLog = require("../models/PainLog");
const MoodLog = require("../models/MoodLog");
const HydrationLog = require("../models/HydrationLog");
const MedicationIntake = require("../models/MedicationIntake");
const MedicationSchedule = require("../models/MedicationSchedule");
const User = require("../models/User");
const Event = require("../models/Event");
const formatRecentLog = require("../utils/formatRecentLog");

const getWidgets = async (req, res) => {
  const activeUserId = req.activeUserId; // ← Child or Parent
  const parentId = req.user._id; // ← Real parent (for goal, coins)

  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Fetch all data in parallel — using activeUserId for logs
  const [
    painToday,
    moodToday,
    hydrationToday,
    intakesToday,
    schedules,
    user,
    upcomingEvents,
  ] = await Promise.all([
    PainLog.find({
      userId: activeUserId,
      date: { $gte: startOfDay, $lt: endOfDay },
    }).lean(),
    MoodLog.find({
      userId: activeUserId,
      date: { $gte: startOfDay, $lt: endOfDay },
    }).lean(),
    HydrationLog.find({
      userId: activeUserId,
      date: { $gte: startOfDay, $lt: endOfDay },
    }).lean(),
    MedicationIntake.find({
      userId: activeUserId,
      dateTime: { $gte: startOfDay, $lt: endOfDay },
    }).lean(),
    MedicationSchedule.find({ userId: activeUserId, status: "Active" }).lean(),
    User.findById(parentId).select("hydrationGoalOz coins firstName").lean(),
    Event.find({
      userId: activeUserId,
      date: { $gte: startOfDay, $lt: endOfDay },
      type: { $in: ["appointment", "medication"] },
    })
      .sort({ date: 1 })
      .limit(3)
      .lean(),
  ]);

  // 1. Pain Summary
  const painSummary =
    painToday.length > 0
      ? {
          count: painToday.length,
          avgIntensity: Number(
            (
              painToday.reduce((s, p) => s + p.intensity, 0) / painToday.length
            ).toFixed(1)
          ),
          highest: Math.max(...painToday.map((p) => p.intensity)),
        }
      : { count: 0, avgIntensity: 0, highest: 0 };

  // 2. Mood Summary
  const moodSummary =
    moodToday.length > 0
      ? {
          avgIntensity: Number(
            (
              moodToday.reduce((s, m) => s + m.intensity, 0) / moodToday.length
            ).toFixed(1)
          ),
          dominant: getDominantMood(moodToday),
        }
      : { avgIntensity: 0, dominant: null };

  // 3. Hydration Progress
  const totalOz = hydrationToday.reduce((s, h) => s + h.amountOz, 0);
  const hydrationProgress = {
    currentOz: Number(totalOz.toFixed(1)),
    goalOz: user?.hydrationGoalOz || 64,
    percentage: Math.min(
      100,
      Math.round((totalOz / (user?.hydrationGoalOz || 64)) * 100)
    ),
  };

  // 4. Medication Adherence
  const todayStr = startOfDay.toISOString().split("T")[0];
  const activeSchedulesToday = schedules.filter(
    (s) =>
      s.fromDate <= startOfDay &&
      (!s.toDate || s.toDate >= startOfDay) &&
      s.daysOfWeek.includes(today.getDay() || 7)
  );

  const expectedDoses = activeSchedulesToday.reduce((sum, s) => {
    const times = Object.values(s.times).filter((t) => t);
    return sum + times.length;
  }, 0);

  const takenDoses = intakesToday.filter((i) => i.status === "Taken").length;
  const adherence =
    expectedDoses > 0
      ? {
          taken: takenDoses,
          expected: expectedDoses,
          percentage: Math.round((takenDoses / expectedDoses) * 100),
        }
      : { taken: 0, expected: 0, percentage: 0 };

  // 5. Upcoming Events
  const upcoming = upcomingEvents.map((e) => ({
    title: e.title,
    time: e.startTime || "All Day",
    type: e.type,
  }));

  // 6. Coin Balance — now shows child's coins if in child mode
  const activeProfile = req.user.getActiveProfile(); // uses method from User model
  const coinBalance = activeProfile.coins;

  res.json({
    profile: {
      name: activeProfile.name,
      type: activeProfile.type,
      isChild: activeProfile.type === "child",
    },
    painSummary,
    moodSummary,
    hydrationProgress,
    medicationAdherence: adherence,
    upcomingEvents: upcoming,
    coinBalance,
  });
};

// Helper: Most frequent emoji
const getDominantMood = (logs) => {
  if (logs.length === 0) return null;
  const counts = logs.reduce((acc, log) => {
    acc[log.emoji] = (acc[log.emoji] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
};

const getRecentLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const activeUserId = req.activeUserId;

    const [painLogs, moodLogs, hydrationLogs] = await Promise.all([
      PainLog.find({ userId: activeUserId })
        .sort({ date: -1 })
        .limit(limit)
        .populate("location", "name")
        .lean(),
      MoodLog.find({ userId: activeUserId })
        .sort({ date: -1 })
        .limit(limit)
        .lean(),
      HydrationLog.find({ userId: activeUserId })
        .sort({ date: -1 })
        .limit(limit)
        .lean(),
    ]);

    const allLogs = [...painLogs, ...moodLogs, ...hydrationLogs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .map(formatRecentLog);

    res.json(allLogs);
  } catch (err) {
    console.error("Home recent logs error:", err);
    res.status(500).json({ error: { message: "Server error" } });
  }
};

module.exports = { getWidgets, getRecentLogs };
