const Joi = require('joi');

const ID_PROOF_TYPES = ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'EMPLOYEE_ID', 'OTHER'];

const create = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(150).allow(null, ''),
  phone: Joi.string()
    .pattern(/^[0-9+\-() ]{7,20}$/)
    .required()
    .messages({ 'string.pattern.base': 'Phone must be a valid phone number (min 7 digits)' }),
  companyName: Joi.string().max(150).allow(null, ''),
  idProofType: Joi.string().valid(...ID_PROOF_TYPES).required(),
  idProofNumber: Joi.string().min(3).max(50).required(),
  photoUrl: Joi.string().uri().allow(null, ''),
  address: Joi.string().max(255).allow(null, ''),
});

const update = Joi.object({
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  email: Joi.string().email().max(150).allow(null, ''),
  phone: Joi.string().pattern(/^[0-9+\-() ]{7,20}$/),
  companyName: Joi.string().max(150).allow(null, ''),
  idProofType: Joi.string().valid(...ID_PROOF_TYPES),
  idProofNumber: Joi.string().min(3).max(50),
  photoUrl: Joi.string().uri().allow(null, ''),
  address: Joi.string().max(255).allow(null, ''),
  isBlacklisted: Joi.boolean(),
}).min(1);

// Dedicated schema for PATCH /:id/blacklist
// reason is required when isBlacklisted is true (validated in service layer)
const blacklistPatch = Joi.object({
  isBlacklisted: Joi.boolean().required(),
  reason: Joi.string().max(500).allow(null, ''),
});

const idParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const search = Joi.object({
  q: Joi.string().max(150).allow(''),
  phone: Joi.string().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(1000).default(20),
});

module.exports = { create, update, blacklistPatch, idParam, search, ID_PROOF_TYPES };
