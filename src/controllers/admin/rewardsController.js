const Achievement = require('../../models/Achievement');
const Badge = require('../../models/Badge');
const fs = require('fs');
const path = require('path');

const createAchievement = async (req, res) => {
  const { title, description } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: { code: 'ICON_REQUIRED', message: 'Icon image is required' } });
  }

  const icon = `/${req.file.path.replace(/\\/g, '/')}`; // normalize: uploads/achievements/xxx.png

  try {
    const achievement = await Achievement.create({
      title: title.trim(),
      description: description?.trim() || '',
      icon,
    });

    res.status(201).json(achievement);
  } catch (err) {
    // Clean up uploaded file on error
    fs.unlink(req.file.path, () => {});
    throw err;
  }
};

const listAchievements = async (req, res) => {
  const achievements = await Achievement.find({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  res.json(achievements);
};

const createBadge = async (req, res) => {
  const { title, description, coinCost } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: { code: 'ICON_REQUIRED', message: 'Icon image is required' } });
  }

  if (!coinCost || isNaN(coinCost) || coinCost < 1) {
    return res.status(400).json({ error: { code: 'INVALID_COIN_COST', message: 'Valid coinCost is required' } });
  }

  const icon = `/${req.file.path.replace(/\\/g, '/')}`;

  try {
    const badge = await Badge.create({
      title: title.trim(),
      description: description?.trim() || '',
      coinCost: Number(coinCost),
      icon,
    });

    res.status(201).json(badge);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    throw err;
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
  if (title) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (coinCost !== undefined) updateData.coinCost = Number(coinCost);

  // If new icon uploaded
  if (req.file) {
    updateData.icon = `/${req.file.path.replace(/\\/g, '/')}`;
  }

  const badge = await Badge.findByIdAndUpdate(badgeId, updateData, { new: true });

  if (!badge) {
    // Delete uploaded file if badge not found
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: { code: 'BADGE_NOT_FOUND' } });
  }

  // Delete old icon if replaced
  if (req.file && badge.icon) {
    const oldPath = path.join(__dirname, '..', '..', badge.icon.replace('/', ''));
    fs.unlink(oldPath, (err) => {
      if (err && err.code !== 'ENOENT') console.error('Failed to delete old icon:', err);
    });
  }

  res.json(badge);
};

const deleteBadge = async (req, res) => {
  const badge = await Badge.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!badge) {
    return res.status(404).json({ error: { code: 'BADGE_NOT_FOUND' } });
  }

  res.json({ success: true, message: 'Badge deactivated' });
};

module.exports = {
  createAchievement,
  listAchievements,
  createBadge,
  listBadges,
  updateBadge,
  deleteBadge
};