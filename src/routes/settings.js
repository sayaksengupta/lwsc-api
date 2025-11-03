const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  updateProfileSchema,
  updateNotificationsSchema,
  updateRemindersSchema,
  updatePrivacySchema
} = require('../validators/settingsValidator');
const {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications,
  getReminders,
  updateReminders,
  getPrivacy,
  updatePrivacy
} = require('../controllers/settingsController');

router.get('/profile', auth, getProfile);
router.patch('/profile', auth, validate(updateProfileSchema), updateProfile);

router.get('/notifications', auth, getNotifications);
router.patch('/notifications', auth, validate(updateNotificationsSchema), updateNotifications);

router.get('/reminders', auth, getReminders);
router.patch('/reminders', auth, validate(updateRemindersSchema), updateReminders);

router.get('/privacy', auth, getPrivacy);
router.patch('/privacy', auth, validate(updatePrivacySchema), updatePrivacy);

module.exports = router;