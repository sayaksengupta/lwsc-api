// validators/settingsValidator.js
const Joi = require("joi");

const updateProfileSchema = Joi.object({
  // ── Parent fields (optional) ──
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string()
    .trim()
    .pattern(/^[\d\s\-\+\(\)]*$/)
    .allow(null, ""),
  avatarUrl: Joi.string().uri().allow(null, ""),

  // ── CHILDREN: Add, Edit, Delete (THE FINAL WORKING VERSION) ──
  children: Joi.array()
    .max(20)
    .items(
      Joi.object({
        // For updating or deleting existing child
        childId: Joi.string().pattern(/^child_[a-f0-9]{24}$/),

        // For adding new child OR updating existing
        name: Joi.string().trim().min(2).max(50),

        dob: Joi.date().iso().max("now"),
        age: Joi.number().integer().min(0).max(18),
        healthNotes: Joi.string().trim().max(500).allow(""),
        avatarUrl: Joi.string().uri().allow(null, ""),

        // For deleting
        delete: Joi.boolean(),
      })
        // ── RULES ──
        // 1. If childId exists → must be update or delete
        .when(Joi.object({ childId: Joi.exist() }), {
          then: Joi.object({
            delete: Joi.boolean().optional(),
            // name is optional when updating
            name: Joi.string().trim().min(2).max(50).optional(),
          }),
        })
        // 2. If no childId → must be adding new child → name required
        .when(Joi.object({ childId: Joi.any().valid(null, undefined, "") }), {
          then: Joi.object({
            name: Joi.string().trim().min(2).max(50).required(),
            delete: Joi.forbidden(), // can't delete when adding
          }),
        })
    ),
})
  .min(1) // at least one field must be present
  .unknown(false); // reject unknown keys

// Other schemas unchanged
const updateNotificationsSchema = Joi.object({
  hydration: Joi.boolean(),
  medication: Joi.boolean(),
  mood: Joi.boolean(),
  pain: Joi.boolean(),
}).min(1);

const updateRemindersSchema = Joi.object({
  hydrationTimes: Joi.array().items(
    Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
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
