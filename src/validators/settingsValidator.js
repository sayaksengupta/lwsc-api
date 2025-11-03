const Joi = require('joi');

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim(),
  lastName: Joi.string().trim(),
  phone: Joi.string().trim().allow(null, ''),
  avatarUrl: Joi.string().uri().allow(null, '')
}).min(1);

const updateNotificationsSchema = Joi.object({
  hydration: Joi.boolean(),
  medication: Joi.boolean(),
  mood: Joi.boolean(),
  pain: Joi.boolean()
}).min(1);

const updateRemindersSchema = Joi.object({
  hydrationTimes: Joi.array().items(
    Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ),
  medication: Joi.boolean()
}).min(1);

const updatePrivacySchema = Joi.object({
  shareWithConnections: Joi.boolean()
});

module.exports = {
  updateProfileSchema,
  updateNotificationsSchema,
  updateRemindersSchema,
  updatePrivacySchema
};