// routes/pain.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const {
  createSchema,
  updateSchema,
  listQuerySchema,
  statsQuerySchema,
} = require("../validators/painValidator");
const {
  list,
  create,
  update,
  remove,
  stats,
} = require("../controllers/painController");
const painLocationController = require("../controllers/painLocationController");

// ────────────────── MIDDLEWARE ORDER IS CRUCIAL ──────────────────
// 1. auth               → sets req.user (parent)
// 2. getActiveUserId    → sets req.activeUserId (childId or parent _id)

router.use(auth); // ← always first
router.use(getActiveUserId); // ← MUST come right after auth

// All routes below now have access to:
//   • req.user._id           → real parent
//   • req.activeUserId       → current profile (child or parent)

// GET /pain/logs
router.get("/logs", validate(listQuerySchema, "query"), list);

// POST /pain/logs
router.post("/logs", validate(createSchema), create);

// PATCH /pain/logs/:id
router.patch("/logs/:id", validate(updateSchema), update);

// DELETE /pain/logs/:id
router.delete("/logs/:id", remove);

// GET /pain/stats
router.get("/stats", validate(statsQuerySchema, "query"), stats);

// GET /pain/locations (Public/User)
router.get("/locations", painLocationController.list);

module.exports = router;
