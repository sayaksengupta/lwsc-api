// validators/authValidator.js
const Joi = require("joi");

const childProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  dob: Joi.date().iso().max("now").optional(),
  age: Joi.when("dob", {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.number().integer().min(0).max(18).optional(),
  }),
  healthNotes: Joi.string().trim().allow("").max(500).optional(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
  }),
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Invalid phone number format",
    }),

  // Child profiles — 100% optional, but validated if present
  childProfiles: Joi.array()
    .items(childProfileSchema)
    .max(10)
    .optional()
    .messages({
      "array.max": "Maximum 10 child profiles allowed",
    }),
});

const loginSchema = Joi.object({
  emailOrUsername: Joi.string().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};