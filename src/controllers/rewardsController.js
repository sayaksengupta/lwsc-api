const CoinTransaction = require('../models/CoinTransaction');
const User = require('../models/User');
const { getPagination } = require('../utils/pagination');

const getBalance = async (req, res) => {
  const user = await User.findById(req.user._id).select('coins');
  res.json({ balance: user.coins });
};

const listTransactions = async (req, res) => {
  const { page, pageSize } = req.query;
  const { skip, limit } = getPagination(page, pageSize);

  const [data, total] = await Promise.all([
    CoinTransaction.find({ userId: req.user._id })
      .sort({ date: -1 })
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

const redeem = async (req, res) => {
  const { amount, rewardCode } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (user.coins < amount) {
    return res.status(400).json({ error: { code: 'INSUFFICIENT_COINS' } });
  }

  // Mock reward validation (in real app: validate code via external service)
  const validRewards = {
    'COFFEE10': 100,
    'DISCOUNT20': 200,
    'FREESHIP': 300
  };

  if (!validRewards[rewardCode] || validRewards[rewardCode] !== amount) {
    return res.status(400).json({ error: { code: 'INVALID_REWARD_CODE' } });
  }

  // Deduct coins
  user.coins -= amount;
  await user.save();

  // Record transaction
  const transaction = await CoinTransaction.create({
    userId,
    type: 'SPEND',
    amount,
    reason: `Redeemed reward: ${rewardCode}`
  });

  res.json({
    id: transaction._id,
    amount,
    rewardCode,
    status: 'SUCCESS'
  });
};

module.exports = { getBalance, listTransactions, redeem };