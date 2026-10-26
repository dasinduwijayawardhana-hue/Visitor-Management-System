const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

const includeRelations = {
  visitor: true,
  hostEmployee: { select: { employeeId: true, firstName: true, lastName: true, email: true } },
  department: { select: { departmentId: true, departmentName: true } },
  approvedByUser: { select: { userId: true, fullName: true } },
  checkedInByUser: { select: { userId: true, fullName: true } },
  checkedOutByUser: { select: { userId: true, fullName: true } },
};

async function list({ page = 1, limit = 20, status, departmentId, hostEmployeeId, visitorId } = {}) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.visitStatus = status;
  if (departmentId) where.departmentId = departmentId;
  if (hostEmployeeId) where.hostEmployeeId = hostEmployeeId;
  if (visitorId) where.visitorId = visitorId;

  const [items, total] = await Promise.all([
    prisma.visit.findMany({ where, skip, take: limit, include: includeRelations, orderBy: { createdAt: 'desc' } }),
    prisma.visit.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function getById(id) {
  const visit = await prisma.visit.findUnique({ where: { visitId: id }, include: includeRelations });
  if (!visit) throw ApiError.notFound('Visit not found.');
  return visit;
}

// Pre-register / register a visit. Registered by a Security Officer or Admin.
async function create(data, approvedByUserId) {
  const [visitor, host, dept] = await Promise.all([
    prisma.visitor.findUnique({ where: { visitorId: data.visitorId } }),
    prisma.employee.findUnique({ where: { employeeId: data.hostEmployeeId } }),
    prisma.department.findUnique({ where: { departmentId: data.departmentId } }),
  ]);
  if (!visitor) throw ApiError.badRequest('visitorId does not reference an existing visitor.');
  if (!host) throw ApiError.badRequest('hostEmployeeId does not reference an existing employee.');
  if (!dept) throw ApiError.badRequest('departmentId does not reference an existing department.');

  if (visitor.isBlacklisted) {
    // Security recommendation #10 in database_design.md: block/flag at check-in.
    // We flag here too since registration is often the first touchpoint.
    throw ApiError.forbidden('This visitor is blacklisted and cannot be registered for a visit.');
  }

  return prisma.visit.create({
    data: {
      visitorId: data.visitorId,
      hostEmployeeId: data.hostEmployeeId,
      departmentId: data.departmentId,
      purpose: data.purpose,
      remarks: data.remarks || null,
      visitStatus: 'Pre_Registered',
      approvedBy: approvedByUserId,
    },
    include: includeRelations,
  });
}

async function checkIn(visitId, { badgeNumber } = {}, checkedInByUserId) {
  const visit = await getById(visitId);

  if (visit.visitStatus === 'Checked_In') {
    throw ApiError.badRequest('Visitor is already checked in.');
  }
  // Generic check-in is for staff-created, pre-registered visits only.
  // Visitor-portal requests must first be approved and verified through the
  // gate-pass endpoint, which consumes their pass.
  if (visit.visitStatus !== 'Pre_Registered') {
    throw ApiError.badRequest(`Cannot check in a visit with status "${visit.visitStatus}".`);
  }
  if (visit.visitor.isBlacklisted) {
    throw ApiError.forbidden('This visitor is blacklisted and cannot be checked in.');
  }

  return prisma.visit.update({
    where: { visitId },
    data: {
      visitStatus: 'Checked_In',
      checkInTime: new Date(),
      badgeNumber: badgeNumber || null,
      checkedInBy: checkedInByUserId,
    },
    include: includeRelations,
  });
}

async function checkOut(visitId, { remarks } = {}, checkedOutByUserId) {
  const visit = await getById(visitId);

  if (visit.visitStatus !== 'Checked_In') {
    throw ApiError.badRequest('Only a currently checked-in visit can be checked out.');
  }

  const checkOutTime = new Date();
  // Mirrors the DB CHECK constraint (check_out_time >= check_in_time) —
  // enforcing it here too gives a friendlier error than a raw DB error.
  if (visit.checkInTime && checkOutTime < visit.checkInTime) {
    throw ApiError.badRequest('Check-out time cannot be earlier than check-in time.');
  }

  return prisma.visit.update({
    where: { visitId },
    data: {
      visitStatus: 'Checked_Out',
      checkOutTime,
      checkedOutBy: checkedOutByUserId,
      remarks: remarks ?? visit.remarks,
    },
    include: includeRelations,
  });
}

async function updateStatus(visitId, { visitStatus, remarks }) {
  const visit = await getById(visitId);

  // This endpoint is an administrative exception action, not a general
  // state setter. Check-in/out and employee approval each have dedicated
  // workflows that also record times, users, and gate-pass state.
  const allowedTransitions = {
    Pre_Registered: ['Cancelled', 'Denied'],
    Pending: ['Cancelled', 'Denied'],
  };
  if (!allowedTransitions[visit.visitStatus]?.includes(visitStatus)) {
    throw ApiError.badRequest(`Cannot change a visit from "${visit.visitStatus}" to "${visitStatus}".`);
  }

  return prisma.visit.update({
    where: { visitId },
    data: { visitStatus, remarks: remarks ?? undefined },
    include: includeRelations,
  });
}

// "Who's inside now" — visitStatus = Checked_In AND check_out_time IS NULL,
// using the composite idx_visits_status_checkin index.
async function currentlyInside() {
  const visits = await prisma.visit.findMany({
    where: { visitStatus: 'Checked_In', checkOutTime: null },
    include: includeRelations,
    orderBy: { checkInTime: 'asc' },
  });

  const now = Date.now();
  return visits.map((v) => ({
    ...v,
    minutesInside: v.checkInTime ? Math.round((now - new Date(v.checkInTime).getTime()) / 60000) : null,
  }));
}

module.exports = { list, getById, create, checkIn, checkOut, updateStatus, currentlyInside };
