const Joi = require("joi");

/**
 * Reusable schemas
 */
const timeString = Joi.string()
  .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  .message("Time must be in HH:mm format (e.g. 08:30)")
  .allow(null);

const timesObject = Joi.object({
  morning: timeString,
  afternoon: timeString,
  evening: timeString,
  bedTime: timeString,
})
  .min(1)
  .message("At least one time slot is required");

const dateString = Joi.string()
  .isoDate()
  .message("Invalid date format (use YYYY-MM-DD)");

/**
 * CREATE MEDICATION SCHEDULE
 */
const createSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Medication name is required",
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),

  dose: Joi.string().min(1).max(50).required().messages({
    "string.empty": "Dose is required",
    "string.max": "Dose cannot exceed 50 characters",
  }),

  reason: Joi.string().max(200).allow(null, "").optional(),

  type: Joi.string()
    .valid("Capsule", "Tablet", "Liquid", "Injection", "Other")
    .required()
    .messages({ "any.only": "Invalid medication type" }),

  times: timesObject.required(),

  fromDate: Joi.date()
    .iso()
    .required()
    .messages({ "date.base": "fromDate is required and must be a valid date" }),

  toDate: Joi.date()
    .iso()
    .min(Joi.ref("fromDate"))
    .allow(null)
    .messages({ "date.min": "toDate cannot be before fromDate" }),

  daysOfWeek: Joi.array()
    .items(Joi.number().integer().min(1).max(7))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one day must be selected",
      "number.min": "Days must be 1 (Mon) to 7 (Sun)",
      "number.max": "Days must be 1 (Mon) to 7 (Sun)",
    }),

  fullWeekReminder: Joi.boolean().optional(),
  intakeTracking: Joi.boolean().optional(),
}).options({ stripUnknown: true });

/**
 * UPDATE MEDICATION SCHEDULE
 */
const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  dose: Joi.string().max(50),
  reason: Joi.string().max(200).allow(null, ""),
  type: Joi.string().valid("Capsule", "Tablet", "Liquid", "Injection", "Other"),
  times: timesObject,
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso().allow(null),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(1).max(7)).min(1),
  status: Joi.string().valid("Active", "Paused", "Ended"),
  fullWeekReminder: Joi.boolean(),
  intakeTracking: Joi.boolean(),
})
  .min(1)
  .required()
  .messages({ "object.min": "At least one field must be provided to update" })
  .options({ stripUnknown: true });

/**
 * CREATE MEDICATION INTAKE
 */
const intakeCreateSchema = Joi.object({
  dateTime: Joi.date().required(),
  label: Joi.string().valid('Morning', 'Afternoon', 'Evening', 'BedTime', 'Custom').required(),
  status: Joi.string().valid('Taken', 'Late', 'Skipped').required(),
  notes: Joi.string().allow('').optional()
  // NO scheduleId here — it comes from URL param
});
/**
 * QUERY PARAMS: from/to dates
 */
const dateRangeSchema = Joi.object({
  from: Joi.date()
    .iso()
    .required()
    .messages({ "any.required": "from date is required" }),
  to: Joi.date().iso().required().min(Joi.ref("from")).messages({
    "any.required": "to date is required",
    "date.min": "to date cannot be before from date",
  }),
});

/**
 * QUERY PARAMS: list intakes (optional from/to)
 */
const intakeQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref("from")),
}).options({ stripUnknown: true });

module.exports = {
  createSchema,
  updateSchema,
  intakeCreateSchema,
  intakeQuerySchema,
  dateRangeSchema,
};
