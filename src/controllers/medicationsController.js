// controllers/medicationsController.js
const MedicationSchedule = require("../models/MedicationSchedule");
const MedicationIntake = require("../models/MedicationIntake");
const { awardLogCoins } = require("../services/coinService");
const { checkAndAwardAchievements } = require("../services/achievementService");

// ── SCHEDULES (Parent can create for child) ─────────────────────
const listSchedules = async (req, res) => {
  const schedules = await MedicationSchedule.find({
    userId: req.activeUserId, // ← Child or Parent
  }).lean();
  res.json(schedules);
};

const createSchedule = async (req, res) => {
  const schedule = await MedicationSchedule.create({
    ...req.body,
    userId: req.activeUserId, // ← Saves to child if in child mode
  });
  res.status(201).json(schedule);
};

const updateSchedule = async (req, res) => {
  const { id } = req.params;
  const schedule = await MedicationSchedule.findOneAndUpdate(
    { _id: id, userId: req.activeUserId },
    req.body,
    { new: true }
  );
  if (!schedule) return res.status(404).json({ error: { code: "NOT_FOUND" } });
  res.json(schedule);
};

const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  const result = await MedicationSchedule.deleteOne({
    _id: id,
    userId: req.activeUserId,
  });
  if (result.deletedCount === 0)
    return res.status(404).json({ error: { code: "NOT_FOUND" } });
  res.json({ success: true });
};

// ── INTAKES ─────────────────────────────────────────────────────
const listIntakes = async (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query;
  const filter = { scheduleId: id, userId: req.activeUserId };
  if (from) filter.dateTime = { ...filter.dateTime, $gte: new Date(from) };
  if (to) filter.dateTime = { ...filter.dateTime, $lte: new Date(to) };

  const intakes = await MedicationIntake.find(filter)
    .sort({ dateTime: -1 })
    .lean();
  res.json(intakes);
};

const createIntake = async (req, res) => {
  const { id: scheduleId } = req.params;

  // Verify schedule belongs to active profile
  const schedule = await MedicationSchedule.findOne({
    _id: scheduleId,
    userId: req.activeUserId,
  });

  if (!schedule) {
    return res.status(404).json({ error: { code: "SCHEDULE_NOT_FOUND" } });
  }

  const intake = await MedicationIntake.create({
    ...req.body,
    userId: req.activeUserId,
    loggedByParent: req.user._id,
    scheduleId,
  });

  await awardLogCoins(req.activeUserId, "medication");
  const newAchievements = await checkAndAwardAchievements(req.activeUserId);

  res.status(201).json({
    intake,
    achievements: newAchievements,
    message:
      newAchievements.length > 0
        ? `Perfect! ${newAchievements.length} achievement(s) unlocked!`
        : "Medicine logged!",
    coinsEarned: 10,
  });
};

// ── HISTORY & ADHERENCE (Now per active profile) ─────────────────
const history = async (req, res) => {
  const { from, to } = req.query;
  const start = new Date(from);
  const end = new Date(to);

  const schedules = await MedicationSchedule.find({
    userId: req.activeUserId,
  }).lean();

  const intakes = await MedicationIntake.find({
    userId: req.activeUserId,
    dateTime: { $gte: start, $lte: end },
  }).lean();

  const history = schedules.map((s) => {
    const days = [];
    const current = new Date(start);
    while (current <= end) {
      const dayStr = current.toISOString().split("T")[0];
      const dayOfWeek = current.getDay() || 7;
      if (s.daysOfWeek.includes(dayOfWeek)) {
        days.push({
          date: dayStr,
          value: intakes.some(
            (i) =>
              i.scheduleId.toString() === s._id.toString() &&
              i.dateTime.toISOString().split("T")[0] === dayStr
          )
            ? 1
            : 0,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return { scheduleId: s._id, name: s.name, adherence: days };
  });

  res.json(history);
};

const adherence = async (req, res) => {
  const { from, to } = req.query;
  const start = new Date(from);
  const end = new Date(to);
  const days = [];

  const current = new Date(start);
  while (current <= end) {
    const dayStr = current.toISOString().split("T")[0];
    const taken = await MedicationIntake.countDocuments({
      userId: req.activeUserId,
      dateTime: {
        $gte: new Date(dayStr),
        $lt: new Date(current.getTime() + 86400000),
      },
      status: "Taken",
    });
    const total = await MedicationIntake.countDocuments({
      userId: req.activeUserId,
      dateTime: {
        $gte: new Date(dayStr),
        $lt: new Date(current.getTime() + 86400000),
      },
    });
    days.push({
      date: dayStr,
      value: total > 0 ? (taken / total >= 0.8 ? 1 : 0) : 0,
    });
    current.setDate(current.getDate() + 1);
  }

  const avg = days.reduce((sum, d) => sum + d.value, 0) / days.length;
  res.json({ series: days, avg: Number(avg.toFixed(2)) });
};

module.exports = {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listIntakes,
  createIntake,
  history,
  adherence,
};
