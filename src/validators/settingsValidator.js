// validators/settingsValidator.js
const Joi = require("joi");

const updateProfileSchema = Joi.object({
  // ── Parent fields ──
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string()
    .trim()
    .pattern(/^[\d\s\-\+\(\)]*$/)
    .allow(null, ""),
  avatarUrl: Joi.string().uri().allow(null, ""),

  // ── CHILDREN: Add, Edit, Delete (THE MAGIC) ──
  children: Joi.array()
    .items(
      Joi.object({
        // For updating existing child
        childId: Joi.string().pattern(/^child_[a-f0-9]{24}$/),

        // For adding new child (childId omitted)
        name: Joi.string().trim().min(2).max(50).required(),
        dob: Joi.date().iso().max("now"), // valid date, not in future
        age: Joi.number().integer().min(0).max(18),
        healthNotes: Joi.string().trim().max(500).allow(""),
        avatarUrl: Joi.string().uri().allow(null, ""),

        // For deleting
        delete: Joi.boolean(),
      })
        .or("childId", "delete") // must have childId if not delete
        .with("childId", ["name"]) // if updating, name is optional but recommended
    )
    .max(20), // safety limit
}).min(1); // at least one field must be present

const updateNotificationsSchema = Joi.object({
  hydration: Joi.boolean(),
  medication: Joi.boolean(),
  mood: Joi.boolean(),
  pain: Joi.boolean(),
}).min(1);

const updateRemindersSchema = Joi.object({
  hydrationTimes: Joi.array().items(
    Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/) // HH:MM 24h
  ),
  medication: Joi.boolean(),
}).min(1);

const updatePrivacySchema = Joi.object({
  shareWithConnections: Joi.boolean(),
}).min(1);

module.exports = {
  updateProfileSchema,
  updateNotificationsSchema,
  updateRemindersSchema,
  updatePrivacySchema,
};
