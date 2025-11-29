// routes/medications.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile"); // ← CRITICAL
const { validate } = require("../middleware/validate");
const medicationValidator = require("../validators/medicationValidator");
const {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listIntakes,
  createIntake,
  history,
  adherence,
} = require("../controllers/medicationsController");

// MIDDLEWARE ORDER IS EVERYTHING
router.use(auth); // sets req.user (parent)
router.use(getActiveUserId); // sets req.activeUserId (child or parent)

router.get("/", listSchedules);
router.post("/", validate(medicationValidator.createSchema), createSchedule);
router.patch(
  "/:id",
  validate(medicationValidator.updateSchema),
  updateSchedule
);
router.delete("/:id", deleteSchedule);

router.get(
  "/:id/intakes",
  validate(medicationValidator.intakeQuerySchema, "query"),
  listIntakes
);
router.post(
  "/:id/intakes",
  validate(medicationValidator.intakeCreateSchema),
  createIntake
);

router.get(
  "/history",
  validate(medicationValidator.dateRangeSchema, "query"),
  history
);
router.get(
  "/adherence",
  validate(medicationValidator.dateRangeSchema, "query"),
  adherence
);

module.exports = router;
