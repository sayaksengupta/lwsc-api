const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');
const PainLog = require('../models/PainLog');
const { sendEmergencySMS } = require('../services/smsService');

const listContacts = async (req, res) => {
  const contacts = await EmergencyContact.find({ userId: req.user._id })
    .sort({ priority: 1, createdAt: 1 })
    .lean();
  res.json(contacts);
};

const createContact = async (req, res) => {
  const { name, phone, relationship, priority } = req.body;

  const existing = await EmergencyContact.findOne({ userId: req.user._id, phone });
  if (existing) {
    return res.status(400).json({ error: { code: 'PHONE_EXISTS' } });
  }

  const contact = await EmergencyContact.create({
    userId: req.user._id,
    name,
    phone,
    relationship,
    priority
  });

  res.status(201).json(contact);
};

const updateContact = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const contact = await EmergencyContact.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!contact) {
    return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  }

  res.json(contact);
};

const deleteContact = async (req, res) => {
  const { id } = req.params;
  const result = await EmergencyContact.deleteOne({ _id: id, userId: req.user._id });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  }

  res.json({ success: true });
};

const getSettings = async (req, res) => {
  const user = await User.findById(req.user._id).select('emergencySettings');
  res.json(user.emergencySettings);
};

const updateSettings = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { 'emergencySettings': updates } },
    { new: true, runValidators: true }
  ).select('emergencySettings');

  res.json(user.emergencySettings);
};

const triggerAlert = async (req, res) => {
  const { painLogId, message: customMessage } = req.body;
  const userId = req.user._id;

  // Validate pain log
  const painLog = await PainLog.findOne({ _id: painLogId, userId });
  if (!painLog) {
    return res.status(404).json({ error: { code: 'PAIN_LOG_NOT_FOUND' } });
  }

  const user = await User.findById(userId).select('firstName lastName emergencySettings');
  const contacts = await EmergencyContact.find({ userId }).sort({ priority: 1 });

  if (contacts.length === 0) {
    return res.status(400).json({ error: { code: 'NO_CONTACTS' } });
  }

  const message = customMessage || user.emergencySettings.alertMessage;
  const fullName = `${user.firstName} ${user.lastName}`;

  const results = [];
  for (const contact of contacts) {
    const result = await sendEmergencySMS(contact.phone, message, fullName);
    results.push({
      contactId: contact._id,
      phone: contact.phone,
      status: result.success ? 'SENT' : 'FAILED'
    });
  }

  res.json({ alertId: painLogId, results });
};

module.exports = {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getSettings,
  updateSettings,
  triggerAlert
};