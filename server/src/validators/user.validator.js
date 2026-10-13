const Joi = require('joi');

const create = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().max(150).required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).max(150).required(),
  phone: Joi.string().allow(null, ''),
  roleId: Joi.number().integer().positive().required(),
  isActive: Joi.boolean().default(true),
});

const update = Joi.object({
  email: Joi.string().email().max(150),
  fullName: Joi.string().min(2).max(150),
  phone: Joi.string().allow(null, ''),
  roleId: Joi.number().integer().positive(),
  isActive: Joi.boolean(),
}).min(1);

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const idParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = { create, update, changePassword, idParam };
