// routes/settings.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const {
  updateProfileSchema,
  updateNotificationsSchema,
  updateRemindersSchema,
  updatePrivacySchema,
} = require("../validators/settingsValidator");
const {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications,
  getReminders,
  updateReminders,
  getPrivacy,
  updatePrivacy,
} = require("../controllers/settingsController");

// MIDDLEWARE ORDER IS EVERYTHING
router.use(auth); // sets req.user (parent)
router.use(getActiveUserId); // sets req.activeUserId + req.activeProfile

// Profile (can be viewed for active profile (child or parent)
// But only parent can edit their own profile
router.get("/profile", getProfile);
router.patch("/profile", validate(updateProfileSchema), updateProfile);

// These are parent-only settings
router.get("/notifications", getNotifications);
router.patch(
  "/notifications",
  validate(updateNotificationsSchema),
  updateNotifications
);

router.get("/reminders", getReminders);
router.patch("/reminders", validate(updateRemindersSchema), updateReminders);

router.get("/privacy", getPrivacy);
router.patch("/privacy", validate(updatePrivacySchema), updatePrivacy);

module.exports = router;
