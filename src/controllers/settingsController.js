// controllers/settingsController.js
const User = require("../models/User");

const getProfile = async (req, res) => {
  const activeProfile = req.activeProfile; // from getActiveUserId middleware

  res.json({
    name: activeProfile.name,
    firstName: activeProfile.firstName || activeProfile.name.split(" ")[0],
    lastName: activeProfile.lastName || "",
    email: activeProfile.email || null,
    phone: activeProfile.phone || null,
    avatarUrl: activeProfile.avatarUrl || null,
    type: activeProfile.type, // "parent" or "child"
    isChild: activeProfile.type === "child",
    canEdit: activeProfile.type === "parent", // only parent can edit
    childId: activeProfile.type === "child" ? activeProfile.childId : null,
  });
};

const updateProfile = async (req, res) => {
  // ONLY the parent can update their own profile
  if (req.activeProfile.type !== "parent") {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "Only parent can update profile" },
    });
  }

  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("firstName lastName email phone avatarUrl");

  res.json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  });
};

const getNotifications = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("settings.notifications")
    .lean();
  res.json(user.settings?.notifications || {});
};

const updateNotifications = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { "settings.notifications": updates } },
    { new: true }
  ).select("settings.notifications");

  res.json(user.settings.notifications);
};

const getReminders = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("settings.reminders")
    .lean();
  res.json(user.settings?.reminders || {});
};

const updateReminders = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { "settings.reminders": updates } },
    { new: true }
  ).select("settings.reminders");

  res.json(user.settings.reminders);
};

const getPrivacy = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("settings.privacy")
    .lean();
  res.json(user.settings?.privacy || {});
};

const updatePrivacy = async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { "settings.privacy": updates } },
    { new: true }
  ).select("settings.privacy");

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
  updatePrivacy,
};