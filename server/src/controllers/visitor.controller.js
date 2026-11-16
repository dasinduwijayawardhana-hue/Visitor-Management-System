const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const visitorService = require('../services/visitor.service');
const logService = require('../services/log.service');

const list = asyncHandler(async (req, res) => {
  const { page, limit, q, phone } = req.query;
  const result = await visitorService.list({ page: Number(page) || 1, limit: Number(limit) || 20, q, phone });
  new ApiResponse(200, 'Visitors retrieved.', result.items, { total: result.total, page: result.page, limit: result.limit }).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const visitor = await visitorService.getById(Number(req.params.id));
  new ApiResponse(200, 'Visitor retrieved.', visitor).send(res);
});

const create = asyncHandler(async (req, res) => {
  const visitor = await visitorService.create(req.body);
  await logService.record({ userId: req.user.userId, action: 'CREATE', entityType: 'Visitor', entityId: visitor.visitorId, description: `Registered visitor ${visitor.firstName} ${visitor.lastName}`, req });
  new ApiResponse(201, 'Visitor registered.', visitor).send(res);
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const visitor = await visitorService.update(id, req.body);
  await logService.record({ userId: req.user.userId, action: 'UPDATE', entityType: 'Visitor', entityId: id, req });
  new ApiResponse(200, 'Visitor updated.', visitor).send(res);
});

const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await visitorService.remove(id);
  await logService.record({ userId: req.user.userId, action: 'DELETE', entityType: 'Visitor', entityId: id, req });
  new ApiResponse(200, 'Visitor deleted.').send(res);
});

// PATCH /api/visitors/:id/blacklist
// Body: { isBlacklisted: boolean, reason?: string }
// reason is REQUIRED when isBlacklisted = true
const setBlacklist = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { isBlacklisted, reason } = req.body;

  const visitor = await visitorService.setBlacklist(
    id,
    Boolean(isBlacklisted),
    reason,
    req.user.userId
  );

  await logService.record({
    userId: req.user.userId,
    action: isBlacklisted ? 'BLACKLIST_ADDED' : 'BLACKLIST_REMOVED',
    entityType: 'Visitor',
    entityId: id,
    description: isBlacklisted
      ? `Visitor ${visitor.firstName} ${visitor.lastName} blacklisted. Reason: ${reason}`
      : `Visitor ${visitor.firstName} ${visitor.lastName} removed from blacklist`,
    req,
  });

  new ApiResponse(200, `Visitor ${isBlacklisted ? 'blacklisted' : 'removed from blacklist'}.`, visitor).send(res);
});

module.exports = { list, getById, create, update, remove, setBlacklist };
