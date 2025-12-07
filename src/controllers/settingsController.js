// controllers/settingsController.js
const { default: mongoose } = require("mongoose");
const User = require("../models/User");


const getProfile = async (req, res) => {
  try {
    const activeProfile = req.activeProfile; // Already built by middleware
    const parent = req.parentUser; // Full parent document with childProfiles

    if (!parent) {
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });
    }

    // Build children list (only shown to parent)
    const children = (parent.childProfiles || []).map((child) => ({
      childId: child.childId,
      name: child.name || "Child",
      age: child.age || null,
      dob: child.dob || null,
      avatarUrl: child.avatarUrl || "/avatars/child-default.png",
      coins: child.coins || 0,
      isActive: child.childId === parent.activeProfileId,
    }));

    // Calculate total family coins
    const totalFamilyCoins =
      (parent.coins || 0) +
      children.reduce((sum, c) => sum + (c.coins || 0), 0);

    res.json({
      // Active profile (parent or child)
      name:
        activeProfile.name ||
        `${activeProfile.firstName || ""} ${
          activeProfile.lastName || ""
        }`.trim(),
      firstName: activeProfile.firstName || null,
      lastName: activeProfile.lastName || null,
      email: activeProfile.email || null,
      phone: activeProfile.phone || null,
      avatarUrl: activeProfile.avatarUrl || null,
      coins: activeProfile.coins || 0,
      type: activeProfile.type, // "parent" or "child"
      isChild: activeProfile.isChild,
      canEdit: activeProfile.type === "parent",
      childId: activeProfile.childId || null,

      // Parent-only data
      hasChildren: children.length > 0,
      children: activeProfile.type === "parent" ? children : [], // hidden from child
      totalFamilyCoins:
        activeProfile.type === "parent" ? totalFamilyCoins : null,
    });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user._id;

  // Only parent can update profile
  if (req.activeProfile.type !== "parent") {
    return res
      .status(403)
      .json({
        error: { code: "FORBIDDEN", message: "Only parent can edit profile" },
      });
  }

  const { firstName, lastName, email, phone, avatarUrl, children } = req.body;

  const updateOps = {};

  // ── Parent fields ──
  if (firstName !== undefined) updateOps["firstName"] = firstName.trim();
  if (lastName !== undefined) updateOps["lastName"] = lastName.trim();
  if (email !== undefined) updateOps["email"] = email.toLowerCase().trim();
  if (phone !== undefined) updateOps["phone"] = phone || null;
  if (avatarUrl !== undefined) updateOps["avatarUrl"] = avatarUrl || null;

  // ── Child operations (safe, reliable, no arrayFilters hell) ──
  if (Array.isArray(children) && children.length > 0) {
    const newChildren = [];
    const childIdsToDelete = new Set();

    children.forEach((child) => {
      if (child.delete && child.childId) {
        childIdsToDelete.add(child.childId);
      } else if (!child.childId) {
        // Add new child
        newChildren.push({
          childId: `child_${new mongoose.Types.ObjectId()}`, // matches your default
          name: (child.name || "New Child").trim(),
          dob: child.dob || null,
          age: child.age !== undefined ? child.age : null,
          healthNotes: child.healthNotes?.trim() || "",
          avatarUrl: child.avatarUrl || "/avatars/child-default.png",
          coins: 0,
          createdAt: new Date(),
        });
      } else {
        // Keep existing (will update below)
        newChildren.push({
          childId: child.childId,
          name: (child.name || "").trim(),
          dob: child.dob || null,
          age: child.age !== undefined ? child.age : null,
          healthNotes: child.healthNotes?.trim() || "",
          avatarUrl: child.avatarUrl || "/avatars/child-default.png",
        });
      }
    });

    // Build full childProfiles array (replace entire array — safest)
    updateOps["childProfiles"] = newChildren.filter(
      (c) => !childIdsToDelete.has(c.childId)
    );
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateOps },
      { new: true, runValidators: true }
    ).select("firstName lastName email phone avatarUrl childProfiles");

    if (!updatedUser) {
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        children: updatedUser.childProfiles.map((c) => ({
          childId: c.childId,
          name: c.name,
          age: c.age,
          dob: c.dob,
          healthNotes: c.healthNotes,
          avatarUrl: c.avatarUrl,
          coins: c.coins,
        })),
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({
          error: {
            code: "DUPLICATE",
            message: "Email or phone already in use",
          },
        });
    }
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
