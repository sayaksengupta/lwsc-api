const User = require('../models/User');

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('firstName lastName email phone avatarUrl')
    .lean();
  res.json(user);
};

const updateProfile = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('firstName lastName email phone avatarUrl');

  res.json(user);
};

const getNotifications = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('settings.notifications')
    .lean();
  res.json(user.settings.notifications);
};

const updateNotifications = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { 'settings.notifications': updates } },
    { new: true }
  ).select('settings.notifications');

  res.json(user.settings.notifications);
};

const getReminders = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('settings.reminders')
    .lean();
  res.json(user.settings.reminders);
};

const updateReminders = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { 'settings.reminders': updates } },
    { new: true }
  ).select('settings.reminders');

  res.json(user.settings.reminders);
};

const getPrivacy = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('settings.privacy')
    .lean();
  res.json(user.settings.privacy);
};

const updatePrivacy = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { 'settings.privacy': updates } },
    { new: true }
  ).select('settings.privacy');

  res.json(user.settings.privacy);
};

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications,
  getReminders,
  updateReminders,
  getPrivacy,
  updatePrivacy
};