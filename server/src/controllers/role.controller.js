const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const roleService = require('../services/role.service');

const list = asyncHandler(async (req, res) => {
  const roles = await roleService.list();
  new ApiResponse(200, 'Roles retrieved successfully.', roles).send(res);
});

module.exports = { list };
