const EmergencyContact = require("../models/EmergencyContact");
const User = require("../models/User");
const { sendEmergencySMS } = require("../services/smsService");

// ── Contacts ─────────────────────────────────────────────────────
const listContacts = async (req, res) => {
  const contacts = await EmergencyContact.find({ userId: req.user._id })
    .sort({ priority: 1, createdAt: 1 })
    .lean();
  res.json(contacts);
};

const createContact = async (req, res) => {
  const { name, phone, relationship, priority = 1 } = req.body;

  const existing = await EmergencyContact.findOne({
    userId: req.user._id,
    phone,
  });
  if (existing) {
    return res.status(400).json({
      error: {
        code: "PHONE_EXISTS",
        message: "Contact with this phone already exists",
      },
    });
  }

  const contact = await EmergencyContact.create({
    userId: req.user._id,
    name,
    phone,
    relationship,
    priority,
  });

  res.status(201).json(contact);
};

const updateContact = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const contact = await EmergencyContact.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!contact) {
    return res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Contact not found" } });
  }

  res.json(contact);
};

const deleteContact = async (req, res) => {
  const { id } = req.params;
  const result = await EmergencyContact.deleteOne({
    _id: id,
    userId: req.user._id,
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: "NOT_FOUND" } });
  }

  res.json({ success: true, message: "Contact deleted" });
};

// ── Settings ─────────────────────────────────────────────────────
const getSettings = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select(
      "emergencySettings.autoAlert emergencySettings.triggerThreshold emergencySettings.emergencyMessage"
    )
    .lean();

  res.json({
    autoAlert: user.emergencySettings.autoAlert,
    triggerThreshold: user.emergencySettings.triggerThreshold,
    emergencyMessage: user.emergencySettings.emergencyMessage,
    hasPinSet: !!user.emergencySettings.emergencyPin,
    pin: user.emergencySettings.emergencyPin,
  });
};

const updateSettings = async (req, res) => {
  const { autoAlert, triggerThreshold } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        "emergencySettings.autoAlert": autoAlert,
        "emergencySettings.triggerThreshold": triggerThreshold,
      },
    },
    { new: true, runValidators: true }
  ).select("emergencySettings.autoAlert emergencySettings.triggerThreshold");

  res.json({
    autoAlert: user.emergencySettings.autoAlert,
    triggerThreshold: user.emergencySettings.triggerThreshold,
  });
};

// ── Emergency Security (PIN + Message) ───────────────────────────
const setEmergencySecurity = async (req, res) => {
  const { currentPin, newPin, emergencyMessage } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId).select(
    "+emergencySettings.emergencyPin"
  );

  // First time setting PIN?
  const isFirstTime = !user.emergencySettings.emergencyPin;

  if (!isFirstTime) {
    // Verify current PIN
    const isCurrentPinValid =
      currentPin === user.emergencySettings.emergencyPin;
    if (!isCurrentPinValid) {
      return res.status(401).json({
        error: {
          code: "INVALID_CURRENT_PIN",
          message: "Current PIN is incorrect",
        },
      });
    }
  }

  // Update message + new PIN (will be hashed by pre-save hook)
  await User.findByIdAndUpdate(userId, {
    $set: {
      "emergencySettings.emergencyMessage": emergencyMessage,
      "emergencySettings.emergencyPin": newPin, // pre-save hashes it
    },
  });

  res.json({
    success: true,
    message: isFirstTime
      ? "Emergency PIN and message set successfully"
      : "Emergency PIN and message updated successfully",
  });
};

const verifyEmergencyPin = async (req, res) => {
  const { emergencyPin } = req.body;
  const user = await User.findById(req.user._id).select(
    "+emergencySettings.emergencyPin"
  );

  if (!user.emergencySettings.emergencyPin) {
    return res.status(400).json({
      error: { code: "NO_PIN_SET", message: "Emergency PIN not set" },
    });
  }

  const isValid = currentPin === user.emergencySettings.emergencyPin;

  res.json({ success: true, verified: isValid });
};

// ── Trigger Alert (Anytime, PIN Required) ────────────────────────
const triggerAlert = async (req, res) => {
  const { emergencyPin, message } = req.body;
  const userId = req.user._id;

  // 1. Validate PIN
  const user = await User.findById(userId)
    .select(
      "+emergencySettings.emergencyPin emergencySettings.emergencyMessage firstName lastName phone"
    )
    .lean();

  if (!user.emergencySettings.emergencyPin) {
    return res.status(400).json({
      error: { code: "NO_PIN_SET", message: "Set your emergency PIN first" },
    });
  }

  const pinValid = currentPin === user.emergencySettings.emergencyPin;
  if (!pinValid) {
    return res
      .status(401)
      .json({ error: { code: "INVALID_PIN", message: "Incorrect PIN" } });
  }

  // 2. Get contacts
  const contacts = await EmergencyContact.find({ userId }).sort({
    priority: 1,
  });
  if (contacts.length === 0) {
    return res.status(400).json({
      error: { code: "NO_CONTACTS", message: "No emergency contacts added" },
    });
  }

  // 3. Final message
  const finalMessage =
    message?.trim() || user.emergencySettings.emergencyMessage;
  const fullName = `${user.firstName} ${user.lastName}`;

  // 4. Send SMS
  const results = [];
  for (const contact of contacts) {
    const smsResult = await sendEmergencySMS(
      contact.phone,
      finalMessage,
      fullName
    );
    results.push({
      contactId: contact._id,
      name: contact.name,
      phone: contact.phone,
      status: smsResult.success ? "SENT" : "FAILED",
      error: smsResult.error || null,
    });
  }

  res.json({
    success: true,
    message: "Emergency alert sent successfully",
    timestamp: new Date().toISOString(),
    messageUsed: finalMessage,
    sentTo: results.filter((r) => r.status === "SENT").length,
    totalContacts: contacts.length,
    results,
  });
};

module.exports = {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getSettings,
  updateSettings,
  setEmergencySecurity,
  verifyEmergencyPin,
  triggerAlert,
};
