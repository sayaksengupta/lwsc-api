const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createContactSchema,
  updateContactSchema,
  updateSettingsSchema
} = require('../validators/emergencyValidator');
const {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getSettings,
  updateSettings,
  triggerAlert
} = require('../controllers/emergencyController');

router.get('/contacts', auth, listContacts);
router.post('/contacts', auth, validate(createContactSchema), createContact);
router.patch('/contacts/:id', auth, validate(updateContactSchema), updateContact);
router.delete('/contacts/:id', auth, deleteContact);

router.get('/settings', auth, getSettings);
router.patch('/settings', auth, validate(updateSettingsSchema), updateSettings);

router.post('/alert', auth, triggerAlert);

module.exports = router;