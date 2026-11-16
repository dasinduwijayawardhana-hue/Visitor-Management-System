const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const visitService = require('../services/visit.service');
const logService = require('../services/log.service');

const list = asyncHandler(async (req, res) => {
  const result = await visitService.list(req.query);
  new ApiResponse(200, 'Visits retrieved.', result.items, { total: result.total, page: result.page, limit: result.limit }).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const visit = await visitService.getById(Number(req.params.id));
  new ApiResponse(200, 'Visit retrieved.', visit).send(res);
});

const create = asyncHandler(async (req, res) => {
  const visit = await visitService.create(req.body, req.user.userId);
  await logService.record({ userId: req.user.userId, action: 'CREATE', entityType: 'Visit', entityId: visit.visitId, description: `Registered visit for visitor ${visit.visitorId}`, req });
  new ApiResponse(201, 'Visit registered.', visit).send(res);
});

const checkIn = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const visit = await visitService.checkIn(id, req.body, req.user.userId);
  await logService.record({ userId: req.user.userId, action: 'CHECK_IN', entityType: 'Visit', entityId: id, req });
  new ApiResponse(200, 'Visitor checked in.', visit).send(res);
});

const checkOut = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const visit = await visitService.checkOut(id, req.body, req.user.userId);
  await logService.record({ userId: req.user.userId, action: 'CHECK_OUT', entityType: 'Visit', entityId: id, req });
  new ApiResponse(200, 'Visitor checked out.', visit).send(res);
});

const updateStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const visit = await visitService.updateStatus(id, req.body);
  await logService.record({ userId: req.user.userId, action: 'UPDATE_STATUS', entityType: 'Visit', entityId: id, description: `Status -> ${req.body.visitStatus}`, req });
  new ApiResponse(200, 'Visit status updated.', visit).send(res);
});

const currentlyInside = asyncHandler(async (req, res) => {
  const visits = await visitService.currentlyInside();
  new ApiResponse(200, 'Visitors currently inside the facility.', visits).send(res);
});

module.exports = { list, getById, create, checkIn, checkOut, updateStatus, currentlyInside };
