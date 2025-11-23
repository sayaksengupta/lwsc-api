const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const {
  createContactSchema,
  updateContactSchema,
  updateSettingsSchema,
  setEmergencySecuritySchema,
  verifyPinSchema,
  triggerAlertSchema,
} = require("../validators/emergencyValidator");

const {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getSettings,
  updateSettings,
  setEmergencySecurity,
  verifyEmergencyPin,
  triggerAlert,
} = require("../controllers/emergencyController");
const User = require("../models/User");

// ── Contacts
router.get("/contacts", auth, listContacts);
router.post("/contacts", auth, validate(createContactSchema), createContact);
router.patch(
  "/contacts/:id",
  auth,
  validate(updateContactSchema),
  updateContact
);
router.delete("/contacts/:id", auth, deleteContact);

// ── General Settings
router.get("/settings", auth, getSettings);
router.patch("/settings", auth, validate(updateSettingsSchema), updateSettings);

// ── Emergency Security (PIN + Message)
router.post(
  "/security",
  auth,
  async (req, res, next) => {
    const user = await User.findById(req.user._id).select(
      "emergencySettings.emergencyPin"
    );
    const isFirstTime = !user.emergencySettings.emergencyPin;

    // Pass context to Joi
    req.joiContext = { isFirstTime };
    next();
  },
  validate(setEmergencySecuritySchema),
  setEmergencySecurity
);

router.post(
  "/security/verify",
  auth,
  validate(verifyPinSchema),
  verifyEmergencyPin
);

// ── Trigger Alert (Anytime, PIN Required)
router.post("/alert", auth, validate(triggerAlertSchema), triggerAlert);

module.exports = router;
