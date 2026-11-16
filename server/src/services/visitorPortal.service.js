const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const blacklistService = require('./blacklist.service');
const logService = require('./log.service');

async function register(userData, visitorData, req) {
  const { username, email, password, fullName, phone } = userData;
  const { companyName, idProofType, idProofNumber, address, photoUrl } = visitorData;

  // 1. Blacklist check on phone or ID proof
  const blacklistEntry = await blacklistService.checkIdentity({
    idProofNumber,
    phone,
  });

  if (blacklistEntry) {
    throw new ApiError(403, 'This visitor is blacklisted and cannot be registered.', {
      blacklisted: true,
      blacklistId: blacklistEntry.id,
      fullName: blacklistEntry.fullName,
      blacklistReason: blacklistEntry.blacklistReason,
    });
  }

  // 2. Check username and email separately for specific error messages
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    throw ApiError.conflict('This username is already taken. Please choose a different username.');
  }
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw ApiError.conflict('This email address is already registered. Please use a different email or log in.');
  }

  // 3. Hash the password
  const passwordHash = await bcrypt.hash(password, env.bcrypt.saltRounds);

  // 4. Resolve Visitor role
  const role = await prisma.role.findUnique({
    where: { roleName: 'Visitor' },
  });
  if (!role) {
    throw ApiError.internal('Visitor registration is currently unavailable. Please contact the administrator.');
  }

  // 5. Execute transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user account
    const user = await tx.user.create({
      data: {
        username,
        email,
        passwordHash,
        roleId: role.roleId,
        fullName,
        phone: phone || null,
        isActive: true,
      },
    });

    // Check if visitor already exists in DB by ID proof
    let visitor = await tx.visitor.findUnique({
      where: { uq_visitor_id_proof: { idProofType, idProofNumber } },
    });

    if (visitor) {
      if (visitor.userId) {
        throw ApiError.conflict('This ID proof is already linked to another user account.');
      }

      // Link existing visitor record to user account and update details
      visitor = await tx.visitor.update({
        where: { visitorId: visitor.visitorId },
        data: {
          userId: user.userId,
          firstName: fullName.split(' ')[0] || 'Visitor',
          lastName: fullName.split(' ').slice(1).join(' ') || 'Visitor',
          email,
          phone,
          companyName: companyName || visitor.companyName,
          address: address || visitor.address,
          photoUrl: photoUrl || visitor.photoUrl,
        },
      });
    } else {
      // Create new Visitor record
      visitor = await tx.visitor.create({
        data: {
          userId: user.userId,
          firstName: fullName.split(' ')[0] || 'Visitor',
          lastName: fullName.split(' ').slice(1).join(' ') || 'Visitor',
          email,
          phone,
          companyName: companyName || null,
          idProofType,
          idProofNumber,
          photoUrl: photoUrl || null,
          address: address || null,
        },
      });
    }

    return { user, visitor };
  });

  // 6. Record audit log
  await logService.record({
    userId: result.user.userId,
    action: 'VISITOR_REGISTER',
    entityType: 'Visitor',
    entityId: result.visitor.visitorId,
    description: `Visitor account self-registered: ${username}`,
    req,
  });

  return {
    userId: result.user.userId,
    username: result.user.username,
    email: result.user.email,
    fullName: result.user.fullName,
    phone: result.user.phone,
    visitorId: result.visitor.visitorId,
  };
}

async function getProfile(userId) {
  const visitor = await prisma.visitor.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          username: true,
          email: true,
          fullName: true,
        },
      },
    },
  });

  if (!visitor) {
    throw ApiError.notFound('Visitor profile not found.');
  }

  return visitor;
}

async function updateProfile(userId, updateData, req) {
  const visitor = await prisma.visitor.findUnique({
    where: { userId },
  });

  if (!visitor) {
    throw ApiError.notFound('Visitor profile not found.');
  }

  // Identity blacklist check on new phone if changed
  if (updateData.phone && updateData.phone !== visitor.phone) {
    const blacklistEntry = await blacklistService.checkIdentity({
      idProofNumber: visitor.idProofNumber,
      phone: updateData.phone,
    });
    if (blacklistEntry) {
      throw ApiError.forbidden('Cannot update phone number: matched a blacklisted profile.');
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Keep the User account fields in sync with the corresponding visitor
    // profile fields. Previously a phone-only profile update left User.phone
    // stale because this block only ran when fullName was supplied.
    if (updateData.fullName !== undefined || updateData.phone !== undefined) {
      await tx.user.update({
        where: { userId },
        data: {
          fullName: updateData.fullName !== undefined ? updateData.fullName : undefined,
          phone: updateData.phone !== undefined ? updateData.phone : undefined,
        },
      });
    }

    const firstName = updateData.fullName ? (updateData.fullName.split(' ')[0] || 'Visitor') : undefined;
    const lastName = updateData.fullName ? (updateData.fullName.split(' ').slice(1).join(' ') || 'Visitor') : undefined;

    // Update Visitor profile
    const updatedVisitor = await tx.visitor.update({
      where: { visitorId: visitor.visitorId },
      data: {
        firstName,
        lastName,
        phone: updateData.phone || undefined,
        companyName: updateData.companyName !== undefined ? updateData.companyName : undefined,
        address: updateData.address !== undefined ? updateData.address : undefined,
        photoUrl: updateData.photoUrl !== undefined ? updateData.photoUrl : undefined,
      },
    });

    return updatedVisitor;
  });

  await logService.record({
    userId,
    action: 'VISITOR_UPDATE_PROFILE',
    entityType: 'Visitor',
    entityId: visitor.visitorId,
    description: 'Visitor profile updated',
    req,
  });

  return result;
}

async function createVisitRequest(userId, requestData, req) {
  const visitor = await prisma.visitor.findUnique({
    where: { userId },
  });

  if (!visitor) {
    throw ApiError.notFound('Visitor profile not found.');
  }

  if (visitor.isBlacklisted) {
    throw ApiError.forbidden('Your account is blacklisted. Visit registration is denied.');
  }

  const { hostEmployeeId, purpose, visitDate, arrivalTime, departureTime, notes } = requestData;

  // Verify employee exists and is active
  const host = await prisma.employee.findUnique({
    where: { employeeId: hostEmployeeId },
  });

  if (!host || !host.isActive) {
    throw ApiError.badRequest('The requested employee is not available or does not exist.');
  }

  const scheduledDate = new Date(visitDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (scheduledDate < today) {
    throw ApiError.badRequest('Visit date cannot be in the past.');
  }

  const arrival = arrivalTime ? new Date(arrivalTime) : null;
  const departure = departureTime ? new Date(departureTime) : null;
  if (arrival && departure && departure <= arrival) {
    throw ApiError.badRequest('Departure time must be later than arrival time.');
  }

  // Create visit request with status 'Pending'
  const visit = await prisma.visit.create({
    data: {
      visitorId: visitor.visitorId,
      hostEmployeeId,
      departmentId: host.departmentId,
      purpose,
      visitStatus: 'Pending',
      visitDate: scheduledDate,
      arrivalTime: arrival,
      departureTime: departure,
      notes: notes || null,
    },
    include: {
      hostEmployee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      department: {
        select: {
          departmentName: true,
        },
      },
    },
  });

  await logService.record({
    userId,
    action: 'VISITOR_CREATE_VISIT',
    entityType: 'Visit',
    entityId: visit.visitId,
    description: `Visitor submitted pending visit request for host ${host.firstName} ${host.lastName}`,
    req,
  });

  return visit;
}

async function getVisits(userId, { page = 1, limit = 20 } = {}) {
  const visitor = await prisma.visitor.findUnique({
    where: { userId },
  });

  if (!visitor) {
    throw ApiError.notFound('Visitor profile not found.');
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.visit.findMany({
      where: { visitorId: visitor.visitorId },
      skip,
      take: limit,
      include: {
        hostEmployee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            departmentName: true,
          },
        },
        gatePass: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.visit.count({
      where: { visitorId: visitor.visitorId },
    }),
  ]);

  return { items, total, page, limit };
}

async function getVisitRequestById(userId, visitId) {
  const visitor = await prisma.visitor.findUnique({
    where: { userId },
  });

  if (!visitor) {
    throw ApiError.notFound('Visitor profile not found.');
  }

  const visit = await prisma.visit.findFirst({
    where: { visitId, visitorId: visitor.visitorId },
    include: {
      visitor: {
        select: {
          visitorId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyName: true,
          idProofType: true,
          idProofNumber: true,
          photoUrl: true,
        },
      },
      hostEmployee: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      department: {
        select: {
          departmentId: true,
          departmentName: true,
        },
      },
      gatePass: true,
    },
  });

  if (!visit) {
    throw ApiError.notFound('Visit request not found.');
  }

  return visit;
}

async function cancelVisit(userId, visitId, req) {
  const visitor = await prisma.visitor.findUnique({
    where: { userId },
  });

  if (!visitor) {
    throw ApiError.notFound('Visitor profile not found.');
  }

  const visit = await prisma.visit.findFirst({
    where: { visitId, visitorId: visitor.visitorId },
  });

  if (!visit) {
    throw ApiError.notFound('Visit request not found.');
  }

  if (['Checked_In', 'Checked_Out', 'Denied', 'Rejected', 'Cancelled', 'Expired'].includes(visit.visitStatus)) {
    throw ApiError.badRequest(`Cannot cancel visit request with status "${visit.visitStatus}".`);
  }

  const result = await prisma.visit.update({
    where: { visitId },
    data: { visitStatus: 'Cancelled' },
  });

  // If there's an active gate pass, invalidate it
  await prisma.gatePass.updateMany({
    where: { visitId, status: 'ACTIVE' },
    data: { status: 'CANCELLED' },
  });

  await logService.record({
    userId,
    action: 'VISITOR_CANCEL_VISIT',
    entityType: 'Visit',
    entityId: visitId,
    description: 'Visitor cancelled their visit request',
    req,
  });

  return result;
}

async function getEmployees() {
  return prisma.employee.findMany({
    where: { isActive: true },
    select: {
      employeeId: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: {
        select: {
          departmentName: true,
        },
      },
    },
    orderBy: { firstName: 'asc' },
  });
}

module.exports = {
  register,
  getProfile,
  updateProfile,
  createVisitRequest,
  getVisits,
  getVisitRequestById,
  cancelVisit,
  getEmployees,
};
