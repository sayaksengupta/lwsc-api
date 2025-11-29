// routes/hydration.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const {
  createLogSchema,
  updateLogSchema,
  goalSchema,
  summaryQuerySchema,
  listQuerySchema,
} = require("../validators/hydrationValidator");
const {
  getSummary,
  listLogs,
  createLog,
  updateLog,
  deleteLog,
  getGoal,
  setGoal,
} = require("../controllers/hydrationController");

// MIDDLEWARE ORDER MATTERS
router.use(auth); // sets req.user (parent)
router.use(getActiveUserId); // sets req.activeUserId (child or parent)

router.get("/summary", validate(summaryQuerySchema, "query"), getSummary);
router.get("/logs", validate(listQuerySchema, "query"), listLogs);
router.post("/logs", validate(createLogSchema), createLog);
router.patch("/logs/:id", validate(updateLogSchema), updateLog);
router.delete("/logs/:id", deleteLog);

router.get("/goals", getGoal);
router.put("/goals", validate(goalSchema), setGoal);

module.exports = router;
