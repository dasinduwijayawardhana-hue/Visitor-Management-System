const Joi = require('joi');

const ID_PROOF_TYPES = ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'EMPLOYEE_ID', 'OTHER'];

// Used by POST /api/blacklist (admin adds a person manually)
const add = Joi.object({
  visitorId: Joi.number().integer().positive().allow(null),
  fullName: Joi.string().min(2).max(200).required(),
  idProofType: Joi.string().valid(...ID_PROOF_TYPES).allow(null, ''),
  idProofNumber: Joi.string().min(3).max(50).allow(null, ''),
  phone: Joi.string().pattern(/^[0-9+\-() ]{7,20}$/).allow(null, ''),
  blacklistReason: Joi.string().min(3).max(500).required(),
}).or('idProofNumber', 'phone'); // at least one identity field must be present

// Used by GET /api/blacklist/check (query params)
const check = Joi.object({
  idProofType: Joi.string().valid(...ID_PROOF_TYPES).allow('', null),
  idProofNumber: Joi.string().min(1).max(50).allow('', null),
  phone: Joi.string().allow('', null),
}).or('idProofNumber', 'phone');

const idParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const listQuery = Joi.object({
  status: Joi.string().valid('ACTIVE', 'REMOVED').allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(1000).default(20),
});

module.exports = { add, check, idParam, listQuery };
