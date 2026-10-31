const Joi = require('joi');

const VISIT_STATUSES = [
  'Pre_Registered', 'Checked_In', 'Checked_Out', 'Cancelled', 'Denied',
  'Pending', 'Approved', 'Rejected', 'Expired',
];

// Creates a visit record — can be a walk-in (visitor already exists) or a
// pre-registration (host schedules a visit ahead of time, no check-in yet).
const create = Joi.object({
  visitorId: Joi.number().integer().positive().required(),
  hostEmployeeId: Joi.number().integer().positive().required(),
  departmentId: Joi.number().integer().positive().required(),
  purpose: Joi.string().min(2).max(255).required(),
  remarks: Joi.string().max(255).allow(null, ''),
});

const checkIn = Joi.object({
  badgeNumber: Joi.string().max(30).allow(null, ''),
});

const checkOut = Joi.object({
  remarks: Joi.string().max(255).allow(null, ''),
});

const updateStatus = Joi.object({
  visitStatus: Joi.string().valid(...VISIT_STATUSES).required(),
  remarks: Joi.string().max(255).allow(null, ''),
});

const idParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const listQuery = Joi.object({
  status: Joi.string().valid(...VISIT_STATUSES),
  departmentId: Joi.number().integer().positive(),
  hostEmployeeId: Joi.number().integer().positive(),
  visitorId: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { create, checkIn, checkOut, updateStatus, idParam, listQuery, VISIT_STATUSES };
