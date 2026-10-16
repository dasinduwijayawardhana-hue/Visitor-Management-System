const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const deptService = require('../services/department.service');
const logService = require('../services/log.service');

const list = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await deptService.list({ page: Number(page) || 1, limit: Number(limit) || 20 });
  new ApiResponse(200, 'Departments retrieved.', result.items, { total: result.total, page: result.page, limit: result.limit }).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const dept = await deptService.getById(Number(req.params.id));
  new ApiResponse(200, 'Department retrieved.', dept).send(res);
});

const create = asyncHandler(async (req, res) => {
  const dept = await deptService.create(req.body);
  await logService.record({ userId: req.user.userId, action: 'CREATE', entityType: 'Department', entityId: dept.departmentId, description: `Created department ${dept.departmentName}`, req });
  new ApiResponse(201, 'Department created.', dept).send(res);
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const dept = await deptService.update(id, req.body);
  await logService.record({ userId: req.user.userId, action: 'UPDATE', entityType: 'Department', entityId: id, req });
  new ApiResponse(200, 'Department updated.', dept).send(res);
});

const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await deptService.remove(id);
  await logService.record({ userId: req.user.userId, action: 'DELETE', entityType: 'Department', entityId: id, req });
  new ApiResponse(200, 'Department deleted.').send(res);
});

module.exports = { list, getById, create, update, remove };
