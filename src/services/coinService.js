// services/coinService.js
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');

const COINS_PER_LOG_TYPE_PER_DAY = 10;

const reasonMap = {
  pain: 'Logged pain entry',
  mood: 'Logged mood',
  hydration: 'Logged hydration',
  medication: 'Recorded medication intake',
};

// Helper: Get start/end of current UTC day
const getUtcDayRange = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

/**
 * Award up to 10 coins per log type per UTC day
 * @param {string|ObjectId} userId
 * @param {'pain'|'mood'|'hydration'|'medication'} type
 */
const awardLogCoins = async (userId, type) => {
  if (!reasonMap[type]) {
    throw new Error('Invalid log type');
  }

  const reason = reasonMap[type];
  const { start, end } = getUtcDayRange();

  // 1. Check if user already earned coins for this type today
  const alreadyEarned = await CoinTransaction.findOne({
    userId,
    reason,
    date: { $gte: start, $lt: end }
  }).lean();

  if (alreadyEarned) {
    // Already got coins today → do nothing
    return null;
  }

  // 2. Award coins atomically
  const session = await User.startSession();

  try {
    let transaction;
    await session.withTransaction(async () => {
      // Increment coins
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { coins: COINS_PER_LOG_TYPE_PER_DAY } },
        { new: true, session }
      ).select('coins');

      if (!user) throw new Error('User not found');

      // Record transaction
      transaction = await CoinTransaction.create([{
        userId,
        type: 'EARN',
        amount: COINS_PER_LOG_TYPE_PER_DAY,
        reason,
      }], { session });
    });

    return transaction?.[0] || null;

  } catch (error) {
    console.error('awardLogCoins error:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = { awardLogCoins };