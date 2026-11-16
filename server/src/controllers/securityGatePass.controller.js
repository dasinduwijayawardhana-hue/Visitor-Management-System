const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');
const gatePassService = require('../services/gatePass.service');
const logService = require('../services/log.service');

const verifyGatePass = asyncHandler(async (req, res) => {
  let { qrToken } = req.body;
  if (!qrToken || !qrToken.trim()) {
    throw ApiError.badRequest('QR code or gate pass token is required.');
  }

  // Support structured JSON QR payloads: { "type": "vms-gate-pass", "token": "..." }
  let tokenValue = qrToken.trim();
  try {
    const parsed = JSON.parse(tokenValue);
    if (parsed && typeof parsed.token === 'string' && parsed.token.trim()) {
      tokenValue = parsed.token.trim();
    }
  } catch {
    // Not JSON — treat as a raw token or passNumber, which is the legacy format
  }

  const result = await gatePassService.verifyGatePass(tokenValue);
  new ApiResponse(200, 'Gate pass verified successfully.', result).send(res);
});

const checkIn = asyncHandler(async (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  const { badgeNumber, qrToken } = req.body;

  if (!qrToken || !qrToken.trim()) {
    throw ApiError.badRequest('A verified gate pass token is required for check-in.');
  }

  // Do not trust a prior browser-side verification: bind the token to this
  // visit on the server immediately before it is consumed.
  const gatePass = await gatePassService.verifyGatePass(qrToken.trim());
  if (gatePass.visitId !== visitId) {
    throw ApiError.forbidden('The supplied gate pass does not belong to this visit.');
  }

  const visit = await prisma.visit.findUnique({
    where: { visitId },
    include: { visitor: true },
  });

  if (!visit) {
    throw ApiError.notFound('Visit request not found.');
  }

  if (visit.visitStatus === 'Checked_In') {
    throw ApiError.badRequest('Visitor is already checked in.');
  }

  if (!['Approved', 'Pre_Registered', 'Pre-Registered'].includes(visit.visitStatus)) {
    throw ApiError.badRequest(`Cannot check in a visit request with status "${visit.visitStatus}".`);
  }

  if (visit.visitor.isBlacklisted) {
    throw ApiError.forbidden('This visitor is blacklisted and cannot be checked in.');
  }

  // Update visit to Checked_In and GatePass to USED in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const updatedVisit = await tx.visit.update({
      where: { visitId },
      data: {
        visitStatus: 'Checked_In',
        checkInTime: new Date(),
        badgeNumber: badgeNumber || `V-${Date.now().toString().slice(-4)}`,
        checkedInBy: req.user.userId,
      },
      include: {
        visitor: true,
        hostEmployee: true,
        department: true,
      },
    });

    // Atomically consume the exact active pass. A zero count means another
    // request consumed/cancelled it after verification, so the transaction
    // rolls back the visit update instead of admitting the visitor.
    const consumedPass = await tx.gatePass.updateMany({
      where: { visitId, status: 'ACTIVE' },
      data: { status: 'USED' },
    });
    if (consumedPass.count !== 1) {
      throw ApiError.badRequest('This gate pass is no longer active.');
    }

    return updatedVisit;
  });

  await logService.record({
    userId: req.user.userId,
    action: 'SECURITY_CHECK_IN',
    entityType: 'Visit',
    entityId: visitId,
    description: `Security Officer checked in visitor ${result.visitor.firstName} ${result.visitor.lastName} with badge ${result.badgeNumber}`,
    req,
  });

  new ApiResponse(200, 'Visitor checked in successfully.', result).send(res);
});

const checkOut = asyncHandler(async (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  const { remarks } = req.body;

  const visit = await prisma.visit.findUnique({
    where: { visitId },
  });

  if (!visit) {
    throw ApiError.notFound('Visit request not found.');
  }

  if (visit.visitStatus !== 'Checked_In') {
    throw ApiError.badRequest('Only currently checked-in visits can be checked out.');
  }

  const result = await prisma.visit.update({
    where: { visitId },
    data: {
      visitStatus: 'Checked_Out',
      checkOutTime: new Date(),
      checkedOutBy: req.user.userId,
      remarks: remarks || visit.remarks,
    },
    include: {
      visitor: true,
      hostEmployee: true,
      department: true,
    },
  });

  await logService.record({
    userId: req.user.userId,
    action: 'SECURITY_CHECK_OUT',
    entityType: 'Visit',
    entityId: visitId,
    description: `Security Officer checked out visitor ${result.visitor.firstName} ${result.visitor.lastName}`,
    req,
  });

  new ApiResponse(200, 'Visitor checked out successfully.', result).send(res);
});

module.exports = {
  verifyGatePass,
  checkIn,
  checkOut,
};
