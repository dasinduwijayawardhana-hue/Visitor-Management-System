const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/database');
const gatePassService = require('../services/gatePass.service');
const logService = require('../services/log.service');

// Helper to get employee record for the logged-in user
async function getEmployeeForUser(userId) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
  });
  if (!employee) {
    throw ApiError.forbidden('You are not registered as an employee host in the system.');
  }
  return employee;
}

const getVisitorRequests = asyncHandler(async (req, res) => {
  const employee = await getEmployeeForUser(req.user.userId);

  const visits = await prisma.visit.findMany({
    where: {
      hostEmployeeId: employee.employeeId,
      visitStatus: 'Pending',
    },
    include: {
      visitor: {
        select: {
          firstName: true,
          lastName: true,
          companyName: true,
          phone: true,
          photoUrl: true,
          idProofType: true,
          idProofNumber: true,
        },
      },
      department: {
        select: {
          departmentName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  new ApiResponse(200, 'Pending visitor requests retrieved.', visits).send(res);
});

const approveRequest = asyncHandler(async (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  const employee = await getEmployeeForUser(req.user.userId);

  const visit = await prisma.visit.findUnique({
    where: { visitId },
  });

  if (!visit) {
    throw ApiError.notFound('Visit request not found.');
  }

  // Security check: only host employee can approve
  if (visit.hostEmployeeId !== employee.employeeId) {
    throw ApiError.forbidden('You are not authorized to approve this visit request.');
  }

  if (visit.visitStatus !== 'Pending') {
    throw ApiError.badRequest(`Cannot approve a visit with status "${visit.visitStatus}".`);
  }

  // Use Prisma's batched transaction rather than an interactive callback.
  // The latter has timed out in production under database latency, leaving
  // approval requests failing after the default five-second callback limit.
  const gatePassData = gatePassService.createGatePassData(visit);
  const [updatedVisit, gatePass] = await prisma.$transaction([
    prisma.visit.update({
      where: { visitId },
      data: {
        visitStatus: 'Approved',
        approvedBy: req.user.userId,
        approvedAt: new Date(),
      },
    }),
    prisma.gatePass.upsert({
      where: { visitId },
      update: gatePassData,
      create: { visitId, ...gatePassData },
    }),
  ]);
  const result = { visit: updatedVisit, gatePass };

  await logService.record({
    userId: req.user.userId,
    action: 'EMPLOYEE_APPROVE_VISIT',
    entityType: 'Visit',
    entityId: visitId,
    description: `Employee approved visit request and generated gate pass ${result.gatePass.passNumber}`,
    req,
  });

  new ApiResponse(200, 'Visit request approved and gate pass generated.', result).send(res);
});

const rejectRequest = asyncHandler(async (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  const { rejectionReason } = req.body;

  if (!rejectionReason || !rejectionReason.trim()) {
    throw ApiError.badRequest('Rejection reason is required.');
  }

  const employee = await getEmployeeForUser(req.user.userId);

  const visit = await prisma.visit.findUnique({
    where: { visitId },
  });

  if (!visit) {
    throw ApiError.notFound('Visit request not found.');
  }

  // Security check: only host employee can reject
  if (visit.hostEmployeeId !== employee.employeeId) {
    throw ApiError.forbidden('You are not authorized to reject this visit request.');
  }

  if (visit.visitStatus !== 'Pending') {
    throw ApiError.badRequest(`Cannot reject a visit with status "${visit.visitStatus}".`);
  }

  const updatedVisit = await prisma.visit.update({
    where: { visitId },
    data: {
      visitStatus: 'Rejected',
      rejectionReason: rejectionReason.trim(),
    },
  });

  await logService.record({
    userId: req.user.userId,
    action: 'EMPLOYEE_REJECT_VISIT',
    entityType: 'Visit',
    entityId: visitId,
    description: `Employee rejected visit request. Reason: ${rejectionReason}`,
    req,
  });

  new ApiResponse(200, 'Visit request rejected successfully.', updatedVisit).send(res);
});

module.exports = {
  getVisitorRequests,
  approveRequest,
  rejectRequest,
};
