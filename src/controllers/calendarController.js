const Event = require('../models/Event');
const PainLog = require('../models/PainLog');
const HydrationLog = require('../models/HydrationLog');
const MoodLog = require('../models/MoodLog');
const MedicationIntake = require('../models/MedicationIntake');

const listEvents = async (req, res) => {
  const { from, to, type } = req.query;
  const filter = { userId: req.user._id };
  if (from) filter.date = { ...filter.date, $gte: new Date(from) };
  if (to) filter.date = { ...filter.date, $lte: new Date(to) };
  if (type) filter.type = type;

  const events = await Event.find(filter).sort({ date: 1 }).lean();
  res.json(events);
};

const createEvent = async (req, res) => {
  const event = await Event.create({ ...req.body, userId: req.user._id });
  res.status(201).json(event);
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!event) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  res.json(event);
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const result = await Event.deleteOne({ _id: id, userId: req.user._id });
  if (result.deletedCount === 0) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  res.json({ success: true });
};

const getDay = async (req, res) => {
  const { date } = req.params;
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  const [events, painLogs, moodLogs, hydrationLogs, medicationIntakes] = await Promise.all([
    Event.find({ userId: req.user._id, date: { $gte: start, $lt: end } }).lean(),
    PainLog.find({ userId: req.user._id, date: { $gte: start, $lt: end } }).lean(),
    MoodLog.find({ userId: req.user._id, date: { $gte: start, $lt: end } }).lean(),
    HydrationLog.find({ userId: req.user._id, date: { $gte: start, $lt: end } }).lean(),
    MedicationIntake.find({ userId: req.user._id, dateTime: { $gte: start, $lt: end } }).lean()
  ]);

  res.json({ events, painLogs, moodLogs, hydrationLogs, medicationIntakes });
};

module.exports = { listEvents, createEvent, updateEvent, deleteEvent, getDay };