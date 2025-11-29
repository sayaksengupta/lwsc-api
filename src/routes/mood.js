// routes/mood.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const {
  createSchema,
  updateSchema,
  listQuerySchema,
  statsQuerySchema,
} = require("../validators/moodValidator");
const {
  list,
  create,
  update,
  remove,
  stats,
} = require("../controllers/moodController");

// ────────────────── MIDDLEWARE ORDER IS CRUCIAL ──────────────────
// 1. auth               → sets req.user (parent)
// 2. getActiveUserId    → sets req.activeUserId (childId or parent _id)

router.use(auth); // ← always first
router.use(getActiveUserId); // ← MUST come right after auth

// All routes below now have access to:
//   • req.user._id           → real parent
//   • req.activeUserId       → current profile (child or parent)

router.get("/logs", validate(listQuerySchema, "query"), list);
router.post("/logs", validate(createSchema), create);
router.patch("/logs/:id", validate(updateSchema), update);
router.delete("/logs/:id", remove);
router.get("/stats", validate(statsQuerySchema, "query"), stats);

module.exports = router;
