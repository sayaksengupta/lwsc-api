// controllers/rewardsController.js
const User = require("../models/User");
const CoinTransaction = require("../models/CoinTransaction");
const Achievement = require("../models/Achievement");
const UserAchievement = require("../models/UserAchievement");
const Badge = require("../models/Badge");
const UserBadge = require("../models/UserBadge");
const { getPagination } = require("../utils/pagination");
const Connection = require("../models/Connection");
const { checkStreak } = require("../services/achievementService");

const getBalance = async (req, res) => {
  const activeProfile = req.activeProfile;
  res.json({
    balance: activeProfile.coins || 0,
    name: activeProfile.name,
    type: activeProfile.type,
  });
};

const listTransactions = async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const { skip, limit } = getPagination(page, pageSize);

  const [data, total] = await Promise.all([
    CoinTransaction.find({ userId: req.activeUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CoinTransaction.countDocuments({ userId: req.activeUserId }),
  ]);

  res.json({
    data,
    meta: { page: parseInt(page), pageSize: limit, total },
  });
};

const getMyAchievements = async (req, res) => {
  const activeUserId = req.activeUserId;

  const achievements = await Achievement.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: "userachievements",
        let: { achId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$achievementId", "$$achId"] },
                  { $eq: ["$userId", activeUserId] },
                ],
              },
            },
          },
        ],
        as: "userData",
      },
    },
    {
      $addFields: {
        isUnlocked: { $gt: [{ $size: "$userData" }, 0] },
        unlockedAt: { $arrayElemAt: ["$userData.awardedAt", 0] },
      },
    },
    { $project: { userData: 0 } },
    { $sort: { isUnlocked: -1, rewardCoins: -1 } },
  ]);

  // Add streak progress
  const withProgress = await Promise.all(
    achievements.map(async (ach) => {
      if (ach.criteria?.type === "streak" && !ach.isUnlocked) {
        const current = await checkStreak(
          activeUserId,
          ach.criteria.logType || "any"
        );
        const needed = ach.criteria.value;
        return {
          ...ach,
          progress: current / needed,
          daysLeft: needed - current,
          streak: current,
        };
      }
      return ach;
    })
  );

  res.json({
    total: achievements.length,
    unlocked: achievements.filter((a) => a.isUnlocked).length,
    achievements: withProgress,
  });
};

const getAvailableBadges = async (req, res) => {
  const badges = await Badge.find({ isActive: true })
    .sort({ coinCost: 1 })
    .lean();
  res.json(badges);
};

const getMyBadges = async (req, res) => {
  const myBadges = await UserBadge.find({ userId: req.activeUserId })
    .populate("badgeId")
    .sort({ redeemedAt: -1 })
    .lean();

  res.json(
    myBadges.map((ub) => ({
      ...ub.badgeId,
      redeemedAt: ub.redeemedAt,
    }))
  );
};

const redeemBadge = async (req, res) => {
  const badgeId = req.params.id;
  const activeUserId = req.activeUserId;

  const badge = await Badge.findOne({ _id: badgeId, isActive: true });
  if (!badge)
    return res.status(404).json({ error: { code: "BADGE_NOT_FOUND" } });

  const activeProfile = req.activeProfile;
  if (activeProfile.coins < badge.coinCost) {
    return res.status(400).json({ error: { code: "INSUFFICIENT_COINS" } });
  }

  const alreadyOwned = await UserBadge.findOne({
    userId: activeUserId,
    badgeId,
  });
  if (alreadyOwned) {
    return res.status(400).json({ error: { code: "ALREADY_OWNED" } });
  }

  await Promise.all([
    User.updateOne(
      { $or: [{ _id: req.user._id }, { "children.childId": activeUserId }] },
      {
        $inc: {
          $cond: [
            { $eq: ["$_id", req.user._id] },
            { coins: -badge.coinCost },
            { "children.$[elem].coins": -badge.coinCost },
          ],
        },
      },
      { arrayFilters: [{ "elem.childId": activeUserId }] }
    ),
    UserBadge.create({ userId: activeUserId, badgeId }),
    CoinTransaction.create({
      userId: activeUserId,
      type: "SPEND",
      amount: badge.coinCost,
      reason: `Redeemed: ${badge.title}`,
    }),
  ]);

  res.json({
    success: true,
    badge: badge.title,
    coinsSpent: badge.coinCost,
    newBalance: activeProfile.coins - badge.coinCost,
  });
};

const getLeaderboard = async (req, res) => {
  const parentId = req.user._id;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  // Get parent's verified connections
  const connections = await Connection.find({
    userId: parentId,
    isVerified: true,
  })
    .select("phone")
    .lean();

  const connectedPhones = connections.map((c) => c.phone);

  // CRITICAL: Include "coins" field for parent!
  const familyUsers = await User.find({
    $or: [{ _id: parentId }, { phone: { $in: connectedPhones } }],
  })
    .select(
      "firstName lastName coins childProfiles.name childProfiles.coins childProfiles.childId"
    )
    .lean();

  const entries = [];

  familyUsers.forEach((user) => {
    const isMeParent = user._id.toString() === parentId.toString();

    // Parent entry
    entries.push({
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Parent",
      coins: user.coins || 0, // ← NOW THIS IS INCLUDED!
      type: "parent",
      isMe: isMeParent,
    });

    // Children entries
    user.childProfiles?.forEach((child) => {
      entries.push({
        name: child.name || "Child",
        coins: child.coins || 0,
        type: "child",
        isMe: child.childId === req.activeUserId, // works when parent views or child views
      });
    });
  });

  // Sort by coins descending
  const sorted = entries
    .sort((a, b) => b.coins - a.coins)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
    .slice(0, limit);

  const myEntry = sorted.find((e) => e.isMe);

  res.json({
    myRank: myEntry?.rank || null,
    myCoins: myEntry?.coins || 0,
    leaderboard: sorted,
  });
};

module.exports = {
  getBalance,
  listTransactions,
  getMyAchievements,
  getAvailableBadges,
  getMyBadges,
  redeemBadge,
  getLeaderboard,
};
