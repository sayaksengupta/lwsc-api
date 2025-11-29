// routes/rewards.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const { listQuerySchema } = require("../validators/rewardsValidator");

const {
  getBalance,
  listTransactions,
  getMyAchievements,
  getAvailableBadges,
  redeemBadge,
  getMyBadges,
  getLeaderboard,
} = require("../controllers/rewardsController");

// MIDDLEWARE ORDER IS EVERYTHING
router.use(auth);
router.use(getActiveUserId); // ← Sets req.activeUserId (child or parent)

router.get("/coins/balance", getBalance);
router.get(
  "/coins/transactions",
  validate(listQuerySchema, "query"),
  listTransactions
);

router.get("/achievements", getMyAchievements);
router.get("/badges/available", getAvailableBadges);
router.post("/badges/:id/redeem", redeemBadge);
router.get("/badges/my", getMyBadges);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
