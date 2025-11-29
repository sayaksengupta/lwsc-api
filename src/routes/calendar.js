// routes/calendar.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const {
  createSchema,
  updateSchema,
  listQuerySchema,
} = require("../validators/calendarValidator");
const {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getDay,
} = require("../controllers/calendarController");

// MIDDLEWARE ORDER IS EVERYTHING
router.use(auth); // sets req.user (parent)
router.use(getActiveUserId); // sets req.activeUserId (child or parent)

router.get("/events", validate(listQuerySchema, "query"), listEvents);
router.post("/events", validate(createSchema), createEvent);
router.patch("/events/:id", validate(updateSchema), updateEvent);
router.delete("/events/:id", deleteEvent);
router.get("/day/:date", getDay);

module.exports = router;
