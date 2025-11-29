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
  const { firstName, lastName, email, phone, avatarUrl, children } = req.body;

  const updateObj = {};

  // Parent updates
  if (firstName) updateObj.firstName = firstName.trim();
  if (lastName) updateObj.lastName = lastName.trim();
  if (email) updateObj.email = email.toLowerCase().trim();
  if (phone !== undefined) updateObj.phone = phone || null;
  if (avatarUrl !== undefined) updateObj.avatarUrl = avatarUrl;

  // Child operations
  if (Array.isArray(children)) {
    const push = [];
    const pull = [];
    const setUpdates = {};

    children.forEach((child, index) => {
      if (child.delete && child.childId) {
        pull.push({ childId: child.childId });
      } else if (!child.childId) {
        // Add new child
        push.push({
          name: child.name?.trim() || "New Child",
          dob: child.dob || null,
          age: child.age || null,
          healthNotes: child.healthNotes?.trim() || "",
          avatarUrl: child.avatarUrl || null,
          coins: 50,
        });
      } else {
        // Update existing
        const prefix = `childProfiles.$[elem${index}]`;
        if (child.name) setUpdates[`${prefix}.name`] = child.name.trim();
        if (child.avatarUrl !== undefined)
          setUpdates[`${prefix}.avatarUrl`] = child.avatarUrl;
        if (child.healthNotes !== undefined)
          setUpdates[`${prefix}.healthNotes`] = child.healthNotes?.trim() || "";
        if (child.dob) setUpdates[`${prefix}.dob`] = child.dob;
        if (child.age !== undefined) setUpdates[`${prefix}.age`] = child.age;
      }
    });

    if (push.length > 0) updateObj.$push = { childProfiles: { $each: push } };
    if (pull.length > 0)
      updateObj.$pull = {
        childProfiles: { $in: pull.map((p) => ({ childId: p.childId })) },
      };
    if (Object.keys(setUpdates).length > 0) {
      updateObj.$set = { ...updateObj.$set, ...setUpdates };
      updateObj.arrayFilters = children
        .filter((c) => c.childId)
        .map((c, i) => ({ [`elem${i}.childId`]: c.childId }));
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateObj, {
    new: true,
    runValidators: true,
    arrayFilters: updateObj.arrayFilters,
  });

  res.json({
    success: true,
    message: "Profiles updated",
    updatedChildren:
      children?.filter((c) => c.childId && !c.delete).length || 0,
    addedChildren: children?.filter((c) => !c.childId).length || 0,
    deletedChildren: children?.filter((c) => c.delete).length || 0,
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
