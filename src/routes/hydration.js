const router = require("express").Router();
const { auth } = require("../middleware/auth");
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

router.get("/summary", auth, validate(summaryQuerySchema, "query"), getSummary);
router.get("/logs", auth, validate(listQuerySchema, "query"), listLogs);
router.post("/logs", auth, validate(createLogSchema), createLog);
router.patch("/logs/:id", auth, validate(updateLogSchema), updateLog);
router.delete("/logs/:id", auth, deleteLog);

router.get("/goals", auth, getGoal);
router.put("/goals", auth, validate(goalSchema), setGoal);

module.exports = router;
