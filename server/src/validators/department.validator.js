const Joi = require('joi');

const create = Joi.object({
  departmentName: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(255).allow(null, ''),
  location: Joi.string().max(150).allow(null, ''),
  isActive: Joi.boolean().default(true),
});

const update = Joi.object({
  departmentName: Joi.string().min(2).max(100),
  description: Joi.string().max(255).allow(null, ''),
  location: Joi.string().max(150).allow(null, ''),
  isActive: Joi.boolean(),
}).min(1);

const idParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = { create, update, idParam };
