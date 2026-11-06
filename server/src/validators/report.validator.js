const Joi = require('joi');

const dailyReport = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}/)
    .required()
    .messages({ 'string.pattern.base': 'date must be in YYYY-MM-DD format' }),
  format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
});

const monthlyReport = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
  month: Joi.number().integer().min(1).max(12).required(),
  format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
});

module.exports = { dailyReport, monthlyReport };
