// controllers/admin/rewardsController.js
const Achievement = require("../../models/Achievement");
const Badge = require("../../models/Badge");
const fs = require("fs");
const path = require("path");
const { getRelativePath } = require("../../config/upload");

// ── ACHIEVEMENTS ─────────────────────────────────────
const createAchievement = async (req, res) => {
  const { title, description, rewardCoins = 50, criteria } = req.body;

  if (!req.file) {
    return res.status(400).json({
      error: { code: "ICON_REQUIRED", message: "Icon image is required" },
    });
  }

  if (!title?.trim()) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({
      error: { code: "TITLE_REQUIRED", message: "Title is required" },
    });
  }

  // Parse criteria if sent as JSON string
  let parsedCriteria;
  try {
    parsedCriteria =
      typeof criteria === "string" ? JSON.parse(criteria) : criteria;
    if (!parsedCriteria?.type || !parsedCriteria?.value) throw new Error();
  } catch {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({
      error: {
        code: "INVALID_CRITERIA",
        message: "Valid criteria object is required",
      },
    });
  }

  const icon = getRelativePath(req.file.path);

  try {
    const achievement = await Achievement.create({
      title: title.trim(),
      description: description?.trim() || "",
      icon,
      rewardCoins: Number(rewardCoins) || 50,
      criteria: parsedCriteria,
    });

    res.status(201).json(achievement);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error("createAchievement error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

const updateAchievement = async (req, res) => {
  const { title, description, rewardCoins, criteria, isActive } = req.body;
  const achievementId = req.params.id;

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined)
    updateData.description = description?.trim() || "";
  if (rewardCoins !== undefined) updateData.rewardCoins = Number(rewardCoins);
  if (isActive !== undefined)
    updateData.isActive = isActive === true || isActive === "true";

  // Handle criteria update
  if (criteria !== undefined) {
    try {
      const parsed =
        typeof criteria === "string" ? JSON.parse(criteria) : criteria;
      if (!parsed?.type || !parsed?.value) throw new Error();
      updateData.criteria = parsed;
    } catch {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        error: {
          code: "INVALID_CRITERIA",
          message: "Valid criteria JSON required",
        },
      });
    }
  }

  // Handle icon replacement
  let oldIconPath = null;
  if (req.file) {
    updateData.icon = getRelativePath(req.file.path);
    if (req.body.oldIcon) oldIconPath = req.body.oldIcon;
  }

  try {
    const achievement = await Achievement.findByIdAndUpdate(
      achievementId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!achievement) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: { code: "ACHIEVEMENT_NOT_FOUND" } });
    }

    // Delete old icon
    if (req.file && oldIconPath) {
      // oldIconPath is e.g. /uploads/badges/file.png
      // We need to convert it back to absolute path for unlink
      const { UPLOADS_ROOT } = require("../../config/upload");
      const projectRoot = path.join(UPLOADS_ROOT, '..');
      const absoluteOldPath = path.join(projectRoot, oldIconPath);
      
      fs.unlink(absoluteOldPath, (err) => {
        if (err && err.code !== "ENOENT")
          console.error("Failed to delete old icon:", err);
      });
    }

    res.json(achievement);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error("updateAchievement error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

const listAchievements = async (req, res) => {
  const achievements = await Achievement.find({ isActive: true })
    .sort({ rewardCoins: -1, createdAt: -1 })
    .lean();
  res.json(achievements);
};

// ── BADGES ──────────────────
const createBadge = async (req, res) => {
  const { title, description, coinCost } = req.body;

  if (!req.file)
    return res.status(400).json({ error: { code: "ICON_REQUIRED" } });
  if (!coinCost || isNaN(coinCost) || coinCost < 1)
    return res.status(400).json({ error: { code: "INVALID_COIN_COST" } });

  const icon = getRelativePath(req.file.path);

  try {
    const badge = await Badge.create({
      title: title.trim(),
      description: description?.trim() || "",
      coinCost: Number(coinCost),
      icon,
    });
    res.status(201).json(badge);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

const listBadges = async (req, res) => {
  const badges = await Badge.find({ isActive: true })
    .sort({ coinCost: 1 })
    .lean();
  res.json(badges);
};

const updateBadge = async (req, res) => {
  const { title, description, coinCost } = req.body;
  const badgeId = req.params.id;

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined)
    updateData.description = description?.trim() || "";
  if (coinCost !== undefined) updateData.coinCost = Number(coinCost);
  if (req.file) updateData.icon = getRelativePath(req.file.path);

  const badge = await Badge.findByIdAndUpdate(badgeId, updateData, {
    new: true,
  });

  if (!badge) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: { code: "BADGE_NOT_FOUND" } });
  }

  if (req.file && req.body.oldIcon) {
    const { UPLOADS_ROOT } = require("../../config/upload");
    const projectRoot = path.join(UPLOADS_ROOT, '..');
    const absoluteOldPath = path.join(projectRoot, req.body.oldIcon);
    fs.unlink(absoluteOldPath, () => {});
  }

  res.json(badge);
};

const deleteBadge = async (req, res) => {
  const badge = await Badge.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!badge)
    return res.status(404).json({ error: { code: "BADGE_NOT_FOUND" } });
  res.json({ success: true, message: "Badge deactivated" });
};

module.exports = {
  createAchievement,
  updateAchievement,
  listAchievements,
  createBadge,
  listBadges,
  updateBadge,
  deleteBadge,
};
