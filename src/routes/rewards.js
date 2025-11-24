// routes/rewards.js
const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { listQuerySchema } = require('../validators/rewardsValidator');

const {
  getBalance,
  listTransactions,
  getMyAchievements,
  getAvailableBadges,
  redeemBadge,
  getMyBadges,
  getLeaderboard
} = require('../controllers/rewardsController');

router.get('/coins/balance', auth, getBalance);
router.get('/coins/transactions', auth, validate(listQuerySchema, 'query'), listTransactions);

// NEW: Achievements & Badges
router.get('/achievements', auth, getMyAchievements);
router.get('/badges/available', auth, getAvailableBadges);
router.post('/badges/:id/redeem', auth, redeemBadge);
router.get('/badges/my', auth, getMyBadges);
router.get('/leaderboard', auth, getLeaderboard);

module.exports = router;