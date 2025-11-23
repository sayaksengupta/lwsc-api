// validators/emergencyValidator.js
const Joi = require("joi");

const createContactSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({ "any.required": "Name is required" }),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid phone number",
      "any.required": "Phone number is required",
    }),
  relationship: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({ "any.required": "Relationship is required" }),
  priority: Joi.number().integer().min(1).max(3).default(1),
});

const updateContactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({ "string.pattern.base": "Invalid phone number" }),
  relationship: Joi.string().trim().min(2).max(50),
  priority: Joi.number().integer().min(1).max(3),
}).min(1); // at least one field must be present

const updateSettingsSchema = Joi.object({
  autoAlert: Joi.boolean(),
  triggerThreshold: Joi.number().integer().min(1).max(10),
}).min(1);

const setEmergencySecuritySchema = Joi.object({
  currentPin: Joi.string()
    .pattern(/^\d{4}$/)
    .when("$isFirstTime", {
      // we'll set context in route
      is: true,
      then: Joi.optional(),
      otherwise: Joi.required().messages({
        "any.required": "Current PIN is required to make changes",
        "string.pattern.base": "Current PIN must be exactly 4 digits",
      }),
    }),

  emergencyMessage: Joi.string().min(10).max(500).required().messages({
    "string.min": "Emergency message must be at least 10 characters",
    "string.max": "Emergency message too long",
    "any.required": "Emergency message is required",
  }),

  newPin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "New PIN must be exactly 4 digits",
      "any.required": "New 4-digit PIN is required",
    }),
}).options({ abortEarly: false });

const verifyPinSchema = Joi.object({
  emergencyPin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "PIN must be exactly 4 digits",
      "any.required": "PIN is required",
    }),
});

const triggerAlertSchema = Joi.object({
  emergencyPin: Joi.string()
    .pattern(/^\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "PIN must be exactly 4 digits",
      "any.required": "PIN is required",
    }),
  message: Joi.string().max(500).allow("").optional().default(null).messages({
    "string.max": "Custom message too long (max 500 chars)",
  }),
});

module.exports = {
  createContactSchema,
  updateContactSchema,
  updateSettingsSchema,
  setEmergencySecuritySchema,
  verifyPinSchema,
  triggerAlertSchema,
};
