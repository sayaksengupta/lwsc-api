// services/coinService.js
const User = require("../models/User");
const CoinTransaction = require("../models/CoinTransaction");

const COINS_PER_LOG_TYPE_PER_DAY = 10;

const reasonMap = {
  pain: "Logged pain entry",
  mood: "Logged mood",
  hydration: "Logged hydration",
  medication: "Recorded medication intake",
  achievement: "Achievement unlocked!",
  bonus: "Bonus from parent",
};

// Helper: UTC day range
const getUtcDayRange = (date = new Date()) => {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

/**
 * Award coins to the ACTIVE profile (child or parent)
 * Max 10 coins per log type per UTC day
 */
const awardLogCoins = async (activeUserId, type, performedBy = null) => {
  const reason = reasonMap[type];
  if (!reason) throw new Error("Invalid coin award type");

  const { start, end } = getUtcDayRange();

  // Prevent duplicate daily reward
  const alreadyEarned = await CoinTransaction.findOne({
    userId: activeUserId,
    reason,
    date: { $gte: start, $lt: end },
  });

  if (alreadyEarned) {
    return { alreadyAwarded: true, coins: 0 };
  }

  // Atomic award
  const session = await mongoose.startSession();
  try {
    let transaction;
    await session.withTransaction(async () => {
      // Increment coins on correct profile
      if (activeUserId.startsWith("child_")) {
        await User.updateOne(
          { "children.childId": activeUserId },
          { $inc: { "children.$.coins": COINS_PER_LOG_TYPE_PER_DAY } },
          { session }
        );
      } else {
        await User.findByIdAndUpdate(
          activeUserId,
          { $inc: { coins: COINS_PER_LOG_TYPE_PER_DAY } },
          { session }
        );
      }

      transaction = await CoinTransaction.create(
        [
          {
            userId: activeUserId,
            performedBy,
            type: "EARN",
            amount: COINS_PER_LOG_TYPE_PER_DAY,
            reason,
            metadata: { logType: type === "achievement" ? null : type },
          },
        ],
        { session }
      );
    });

    return {
      alreadyAwarded: false,
      coins: COINS_PER_LOG_TYPE_PER_DAY,
      transaction: transaction[0],
    };
  } catch (error) {
    console.error("awardLogCoins error:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { awardLogCoins };
