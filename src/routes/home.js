// routes/home.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile"); // ← MUST ADD
const { getWidgets, getRecentLogs } = require("../controllers/homeController");

// Critical: Order matters!
router.use(auth); // sets req.user
router.use(getActiveUserId); // sets req.activeUserId + req.activeProfileType

router.get("/widgets", getWidgets);
router.get("/recent-logs", getRecentLogs);

module.exports = router;
