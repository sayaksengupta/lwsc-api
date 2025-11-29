// routes/dashboard.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const { overviewQuerySchema } = require("../validators/dashboardValidator");
const { getOverview } = require("../controllers/dashboardController");

// MIDDLEWARE ORDER IS EVERYTHING
router.use(auth); // sets req.user (parent)
router.use(getActiveUserId); // sets req.activeUserId + req.activeProfileType

router.get("/overview", validate(overviewQuerySchema, "query"), getOverview);

module.exports = router;
