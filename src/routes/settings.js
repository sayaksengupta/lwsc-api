// routes/settings.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const {
  updateParentSchema,
  addChildSchema,
  updateChildSchema,
  updateNotificationsSchema,
  updateRemindersSchema,
  updatePrivacySchema
} = require("../validators/settingsValidator");
const {
  getProfile,
  updateParentProfile,
  addChild,
  updateChild,
  deleteChild,
  getNotifications,
  updateNotifications,
  getReminders,
  updateReminders,
  getPrivacy,
  updatePrivacy,
} = require("../controllers/settingsController");

router.use(auth);
router.use(getActiveUserId);

// Parent profile
router.get("/profile", getProfile);
router.patch("/profile", validate(updateParentSchema), updateParentProfile);

// Child management
router.post("/children", validate(addChildSchema), addChild);
router.patch("/children/:childId", validate(updateChildSchema), updateChild);
router.delete("/children/:childId", deleteChild);

// Other settings
router.get("/notifications", getNotifications);
router.patch("/notifications", validate(updateNotificationsSchema), updateNotifications);
router.get("/reminders", getReminders);
router.patch("/reminders", validate(updateRemindersSchema), updateReminders);
router.get("/privacy", getPrivacy);
router.patch("/privacy", validate(updatePrivacySchema), updatePrivacy);

module.exports = router;