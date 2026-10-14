const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const userService = require('../services/user.service');
const logService = require('../services/log.service');

const list = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await userService.list({ page: Number(page) || 1, limit: Number(limit) || 20 });
  new ApiResponse(200, 'Users retrieved.', result.items, { total: result.total, page: result.page, limit: result.limit }).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const user = await userService.getById(Number(req.params.id));
  new ApiResponse(200, 'User retrieved.', user).send(res);
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.create(req.body);
  await logService.record({ userId: req.user.userId, action: 'CREATE', entityType: 'User', entityId: user.userId, description: `Admin created user ${user.username}`, req });
  new ApiResponse(201, 'User created.', user).send(res);
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const user = await userService.update(id, req.body);
  await logService.record({ userId: req.user.userId, action: 'UPDATE', entityType: 'User', entityId: id, description: 'Admin updated user', req });
  new ApiResponse(200, 'User updated.', user).send(res);
});

const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await userService.remove(id);
  await logService.record({ userId: req.user.userId, action: 'DELETE', entityType: 'User', entityId: id, description: 'Admin deleted user', req });
  new ApiResponse(200, 'User deleted.').send(res);
});

const changePassword = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  // Users may only change their own password unless they're an Admin.
  if (req.user.role !== 'Admin' && req.user.userId !== id) {
    throw ApiError.forbidden('You can only change your own password.');
  }
  await userService.changePassword(id, req.body.currentPassword, req.body.newPassword);
  await logService.record({ userId: req.user.userId, action: 'CHANGE_PASSWORD', entityType: 'User', entityId: id, req });
  new ApiResponse(200, 'Password changed successfully.').send(res);
});

module.exports = { list, getById, create, update, remove, changePassword };
