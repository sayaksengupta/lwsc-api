// routes/analytics.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const {
  comparisonSchema,
  correlationsSchema,
} = require("../validators/analyticsValidator");
const {
  comparison,
  correlations,
} = require("../controllers/analyticsController");

router.use(auth);
router.use(getActiveUserId);

router.get("/comparison", validate(comparisonSchema, "query"), comparison);
router.get(
  "/correlations",
  validate(correlationsSchema, "query"),
  correlations
);

module.exports = router;
