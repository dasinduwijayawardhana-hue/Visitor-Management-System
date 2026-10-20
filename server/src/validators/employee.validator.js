const Joi = require('joi');

const create = Joi.object({
  employeeCode: Joi.string().min(2).max(30).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(150).required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Confirm Password must match Password'
  }),
  phone: Joi.string().allow(null, ''),
  designation: Joi.string().max(100).allow(null, ''),
  departmentId: Joi.number().integer().positive().required(),
  userId: Joi.number().integer().positive().allow(null),
  isActive: Joi.boolean().default(true),
});

const update = Joi.object({
  employeeCode: Joi.string().min(2).max(30),
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  email: Joi.string().email().max(150),
  phone: Joi.string().allow(null, ''),
  designation: Joi.string().max(100).allow(null, ''),
  departmentId: Joi.number().integer().positive(),
  userId: Joi.number().integer().positive().allow(null),
  isActive: Joi.boolean(),
}).min(1);

const idParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = { create, update, idParam };
