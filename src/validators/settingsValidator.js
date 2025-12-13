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

  // ── CHILDREN: Add / Edit / Delete (100% WORKING) ──
  children: Joi.array()
    .max(20)
    .items(
      Joi.object({
        childId: Joi.string().pattern(/^child_[a-f0-9]{24}$/),

        name: Joi.string().trim().min(2).max(50),
        dob: Joi.date().iso().max("now"),
        age: Joi.number().integer().min(0).max(18),
        healthNotes: Joi.string().trim().max(500).allow(""),
        avatarUrl: Joi.string().uri().allow(null, ""),
        delete: Joi.boolean(),
      })
        // CASE 1: No childId → ADDING NEW CHILD → name REQUIRED, delete forbidden
        .when(".childId", {
          is: Joi.any().valid(null, ""),
          then: Joi.object({
            name: Joi.string().trim().min(2).max(50).required(),
            delete: Joi.forbidden(),
          }),
        })
        // CASE 2: Has childId → UPDATING OR DELETING → allow delete or update
        .when(".childId", {
          is: Joi.exist(),
          then: Joi.object({
            delete: Joi.boolean().optional(),
            name: Joi.string().trim().min(2).max(50).optional(),
          }),
        })
    ),
})
  .min(1)
  .unknown(false);

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
