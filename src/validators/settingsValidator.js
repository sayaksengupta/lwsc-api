// validators/settingsValidator.js
const Joi = require("joi");

// Parent profile update (only personal info)
const updateParentSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string().trim().allow(null, ""),
  avatarUrl: Joi.string().uri().allow(null, ""),
}).min(1);

// Add new child
const addChildSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  dob: Joi.date().iso().max("now"),
  age: Joi.number().integer().min(0).max(18),
  healthNotes: Joi.string().trim().max(500).allow(""),
  avatarUrl: Joi.string().uri().allow(null, ""),
}).min(1);

// Update existing child
const updateChildSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  dob: Joi.date().iso().max("now"),
  age: Joi.number().integer().min(0).max(18),
  healthNotes: Joi.string().trim().max(500).allow(""),
  avatarUrl: Joi.string().uri().allow(null, ""),
}).min(1);

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
  updateParentSchema,
  addChildSchema,
  updateChildSchema,
  updateNotificationsSchema,
  updateRemindersSchema,
  updatePrivacySchema,
};
