const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');

const COINS_PER_LOG = 10;

const reasonMap = {
  pain: 'Logged pain entry',
  mood: 'Logged mood',
  hydration: 'Logged hydration',
  medication: 'Recorded medication intake',
};

/**
 * Award 10 coins for logging any health activity
 * @param {string|ObjectId} userId 
 * @param {'pain'|'mood'|'hydration'|'medication'} type 
 */
const awardLogCoins = async (userId, type) => {
  const reason = reasonMap[type] || 'Logged health activity';

  // Use a single atomic operation to avoid race conditions
  const session = await User.startSession();
  let transaction;

  try {
    await session.withTransaction(async () => {
      // 1. Increment user's coin balance
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { coins: COINS_PER_LOG } },
        { new: true, session }
      );

      if (!user) {
        throw new Error('User not found');
      }

      // 2. Record the transaction
      transaction = await CoinTransaction.create([{
        userId,
        type: 'EARN',
        amount: COINS_PER_LOG,
        reason,
      }], { session });
    });
  } finally {
    await session.endSession();
  }

  return transaction?.[0] || null;
};

module.exports = { awardLogCoins };