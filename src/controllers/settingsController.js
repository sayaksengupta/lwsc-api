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
  const userId = req.user._id;
  const updates = req.body;

  // Parent can update:
  // - Their own profile: firstName, lastName, email, phone, avatarUrl
  // - Child profiles: add, edit, delete

  const userUpdate = {};
  const childOperations = {};

  // 1. Parent fields
  if (updates.firstName) userUpdate.firstName = updates.firstName.trim();
  if (updates.lastName) userUpdate.lastName = updates.lastName.trim();
  if (updates.email) userUpdate.email = updates.email.toLowerCase().trim();
  if (updates.phone !== undefined) userUpdate.phone = updates.phone || null;
  if (updates.avatarUrl !== undefined) userUpdate.avatarUrl = updates.avatarUrl;

  // 2. Child operations
  if (updates.addChild) {
    // { addChild: { name: "Zain", dob: "2020-01-10", healthNotes: "..." } }
    childOperations.$push = {
      childProfiles: {
        name: updates.addChild.name.trim(),
        age: updates.addChild.age || null,
        dob: updates.addChild.dob || null,
        healthNotes: updates.addChild.healthNotes?.trim() || "",
        avatarUrl: updates.addChild.avatarUrl || "/avatars/child-default.png",
        coins: 50,
      },
    };
  }

  if (updates.updateChild && updates.updateChild.childId) {
    const { childId, ...childUpdates } = updates.updateChild;

    const setFields = {};
    if (childUpdates.name)
      setFields["childProfiles.$.name"] = childUpdates.name.trim();
    if (childUpdates.avatarUrl !== undefined)
      setFields["childProfiles.$.avatarUrl"] = childUpdates.avatarUrl;
    if (childUpdates.healthNotes !== undefined)
      setFields["childProfiles.$.healthNotes"] =
        childUpdates.healthNotes?.trim() || "";
    if (childUpdates.dob) setFields["childProfiles.$.dob"] = childUpdates.dob;
    if (childUpdates.age !== undefined)
      setFields["childProfiles.$.age"] = childUpdates.age;

    childOperations.$set = {
      ...childOperations.$set,
      ...setFields,
    };

    // For $set on array element, we need arrayFilters
    childOperations.arrayFilters = [{ "elem.childId": childId }];
  }

  if (updates.deleteChildId) {
    childOperations.$pull = {
      childProfiles: { childId: updates.deleteChildId },
    };
  }

  try {
    const updateObj = {
      ...userUpdate,
      ...childOperations,
    };

    const user = await User.findByIdAndUpdate(userId, updateObj, {
      new: true,
      runValidators: true,
      arrayFilters: childOperations.arrayFilters,
    });

    if (!user) {
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });
    }

    // Return fresh active profile
    const activeProfile = user.getActiveProfile();

    res.json({
      success: true,
      message: "Profile updated",
      profile: {
        name: activeProfile.name,
        type: activeProfile.type,
        isChild: activeProfile.type === "child",
        canEdit: true,
        childId: activeProfile.type === "child" ? activeProfile.childId : null,
        avatarUrl: activeProfile.avatarUrl,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
      hasChildren: user.hasChildren,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
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
