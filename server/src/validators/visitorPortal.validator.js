const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().max(150).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  fullName: Joi.string().max(150).required(),
  phone: Joi.string().max(20).required(),
  companyName: Joi.string().max(150).allow('', null),
  idProofType: Joi.string().valid('NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'EMPLOYEE_ID', 'OTHER').required(),
  idProofNumber: Joi.string().max(50).required(),
  address: Joi.string().max(255).allow('', null),
});

const updateProfileSchema = Joi.object({
  fullName: Joi.string().max(150).optional(),
  phone: Joi.string().max(20).optional(),
  companyName: Joi.string().max(150).allow('', null).optional(),
  address: Joi.string().max(255).allow('', null).optional(),
});

const createVisitRequestSchema = Joi.object({
  hostEmployeeId: Joi.number().integer().required(),
  purpose: Joi.string().max(255).required(),
  visitDate: Joi.date().iso().required(),
  arrivalTime: Joi.date().iso().allow('', null).optional(),
  departureTime: Joi.date().iso().allow('', null).optional(),
  notes: Joi.string().max(255).allow('', null).optional(),
});

module.exports = {
  registerSchema,
  updateProfileSchema,
  createVisitRequestSchema,
};
