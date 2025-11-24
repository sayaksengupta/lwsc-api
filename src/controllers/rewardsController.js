// controllers/rewardsController.js
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const { getPagination } = require('../utils/pagination');
const Connection = require('../models/Connection');

const getBalance = async (req, res) => {
  const user = await User.findById(req.user._id).select('coins');
  res.json({ balance: user.coins || 0 });
};

const listTransactions = async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const { skip, limit } = getPagination(page, pageSize);

  const [data, total] = await Promise.all([
    CoinTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CoinTransaction.countDocuments({ userId: req.user._id })
  ]);

  res.json({
    data,
    meta: { page: parseInt(page), pageSize: limit, total }
  });
};

// ── ACHIEVEMENTS ──
const getMyAchievements = async (req, res) => {
  const [achievements, unlocked] = await Promise.all([
    Achievement.find({ isActive: true }).lean(),
    UserAchievement.find({ userId: req.user._id }).select('achievementId').lean()
  ]);

  const unlockedIds = new Set(unlocked.map(u => u.achievementId.toString()));

  const result = achievements.map(a => ({
    ...a,
    isUnlocked: unlockedIds.has(a._id.toString())
  }));

  res.json(result);
};

// ── BADGES ──
const getAvailableBadges = async (req, res) => {
  const badges = await Badge.find({ isActive: true }).sort({ coinCost: 1 }).lean();
  res.json(badges);
};

const getMyBadges = async (req, res) => {
  const myBadges = await UserBadge.find({ userId: req.user._id })
    .populate('badgeId')
    .sort({ redeemedAt: -1 })
    .lean();

  res.json(myBadges.map(ub => ({
    ...ub.badgeId,
    redeemedAt: ub.redeemedAt
  })));
};

const redeemBadge = async (req, res) => {
  const badgeId = req.params.id;
  const userId = req.user._id;

  const badge = await Badge.findOne({ _id: badgeId, isActive: true });
  if (!badge) return res.status(404).json({ error: { code: 'BADGE_NOT_FOUND' } });

  const user = await User.findById(userId);
  if (user.coins < badge.coinCost) {
    return res.status(400).json({ error: { code: 'INSUFFICIENT_COINS' } });
  }

  const alreadyOwned = await UserBadge.findOne({ userId, badgeId });
  if (alreadyOwned) {
    return res.status(400).json({ error: { code: 'BADGE_ALREADY_OWNED' } });
  }

  // Atomic: deduct coins + award badge + record spend
  await Promise.all([
    User.findByIdAndUpdate(userId, { $inc: { coins: -badge.coinCost } }),
    UserBadge.create({ userId, badgeId }),
    CoinTransaction.create({
      userId,
      type: 'SPEND',
      amount: badge.coinCost,
      reason: `Redeemed badge: ${badge.title}`
    })
  ]);

  res.json({
    success: true,
    badge: badge.title,
    coinsSpent: badge.coinCost,
    remainingCoins: user.coins - badge.coinCost
  });
};

const getLeaderboard = async (req, res) => {
  const currentUserId = req.user._id;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100); // max 100 for safety

  try {
    // 1. Get current user
    const currentUser = await User.findById(currentUserId)
      .select('firstName lastName coins')
      .lean();

    if (!currentUser) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND' } });
    }

    // 2. Get verified connections' phones
    const connections = await Connection.find({
      userId: currentUserId,
      isVerified: true
    }).select('phone').lean();

    const connectionPhones = connections.map(c => c.phone).filter(Boolean);

    // 3. Fetch all relevant users (me + connections)
    const users = await User.find({
      $or: [
        { _id: currentUserId },
        { phone: { $in: connectionPhones } }
      ]
    }).select('firstName lastName coins').lean();

    // 4. Build & sort leaderboard
    const leaderboard = users
      .map(user => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous';
        const isMe = user._id.toString() === currentUserId.toString();

        return {
          userId: user._id.toString(),
          name: isMe ? `${name} (You)` : name,
          coins: user.coins || 0,
          isMe
        };
      })
      .sort((a, b) => b.coins - a.coins);

    // 5. Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // 6. My rank & coins
    const myEntry = leaderboard.find(e => e.isMe);
    const myRank = myEntry?.rank || null;
    const myCoins = myEntry?.coins || 0;

    // 7. Apply limit (top N only — no pagination needed for small list)
    const topN = leaderboard.slice(0, limit);

    res.json({
      success: true,
      myRank,
      myCoins,
      totalParticipants: leaderboard.length,
      leaderboard: topN.map(({ rank, name, coins, isMe }) => ({
        rank,
        name,
        coins,
        isMe
      }))
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
};

module.exports = {
  getBalance,
  listTransactions,
  getMyAchievements,
  getAvailableBadges,
  getMyBadges,
  redeemBadge,
  getLeaderboard
};