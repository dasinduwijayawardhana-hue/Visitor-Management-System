const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const blacklistService = require('../services/blacklist.service');
const logService = require('../services/log.service');

// GET /api/blacklist — Admin list
const list = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await blacklistService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status: status || undefined,
  });
  new ApiResponse(200, 'Blacklist retrieved.', result.items, {
    total: result.total,
    page: result.page,
    limit: result.limit,
  }).send(res);
});

// GET /api/blacklist/check — Identity probe (Admin + Security Officer)
// Query: ?idProofNumber=XXX&phone=YYY
const check = asyncHandler(async (req, res) => {
  const { idProofNumber, phone } = req.query;
  const entry = await blacklistService.checkIdentity({ idProofNumber, phone });
  if (entry) {
    return new ApiResponse(200, 'Identity found in blacklist.', {
      blacklisted: true,
      entry: {
        id: entry.id,
        fullName: entry.fullName,
        blacklistReason: entry.blacklistReason,
        createdAt: entry.createdAt,
      },
    }).send(res);
  }
  return new ApiResponse(200, 'Identity is clear.', { blacklisted: false }).send(res);
});

// POST /api/blacklist — Admin manually adds a person
const add = asyncHandler(async (req, res) => {
  const { visitorId, fullName, idProofType, idProofNumber, phone, blacklistReason } = req.body;
  const entry = await blacklistService.addToBlacklist(
    { visitorId, fullName, idProofType, idProofNumber, phone, blacklistReason },
    req.user.userId
  );
  await logService.record({
    userId: req.user.userId,
    action: 'BLACKLIST_ADDED',
    entityType: 'BlacklistedPerson',
    entityId: entry.id,
    description: `Blacklisted: ${fullName}. Reason: ${blacklistReason}`,
    req,
  });
  new ApiResponse(201, 'Person added to blacklist.', entry).send(res);
});

// DELETE /api/blacklist/:id — Admin removes (sets REMOVED, does not delete row)
const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const entry = await blacklistService.getById(id);
  const updated = await blacklistService.removeFromBlacklist(id, req.user.userId);
  await logService.record({
    userId: req.user.userId,
    action: 'BLACKLIST_REMOVED',
    entityType: 'BlacklistedPerson',
    entityId: id,
    description: `Removed blacklist for: ${entry.fullName}`,
    req,
  });
  new ApiResponse(200, 'Blacklist entry removed.', updated).send(res);
});

module.exports = { list, check, add, remove };
