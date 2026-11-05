const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const logService = require('../services/log.service');

const list = asyncHandler(async (req, res) => {
  const result = await logService.list(req.query);
  new ApiResponse(200, 'Audit logs retrieved.', result.items, {
    total: result.total,
    page: result.page,
    limit: result.limit,
  }).send(res);
});

module.exports = { list };
