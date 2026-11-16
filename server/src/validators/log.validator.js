const Joi = require('joi');

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  q: Joi.string().max(150).allow(''),
  userId: Joi.number().integer().positive(),
  action: Joi.string().max(100).allow(''),
  startDate: Joi.date().iso().allow(null, ''),
  endDate: Joi.date().iso().allow(null, ''),
});

module.exports = { listQuery };
