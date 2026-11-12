const crypto = require('crypto');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

function createGatePassData(visit) {
  let baseDate = visit.visitDate ? new Date(visit.visitDate) : new Date();
  if (isNaN(baseDate.getTime())) {
    baseDate = new Date();
  }

  // Format YYYYMMDD for human-readable pass number
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const rand = Math.floor(1000 + Math.random() * 9000);
  const passNumber = `GP-${dateStr}-${rand}`;

  // Generate secure token (64 hex characters from 32 bytes)
  const qrToken = crypto.randomBytes(32).toString('hex');

  // Define validity window (visitDate 00:00:00 to 23:59:59)
  const validFrom = new Date(baseDate);
  validFrom.setHours(0, 0, 0, 0);

  const validUntil = new Date(baseDate);
  validUntil.setHours(23, 59, 59, 999);

  return { passNumber, qrToken, validFrom, validUntil, status: 'ACTIVE' };
}

async function generateGatePass(visitId, db = prisma) {
  const visit = await db.visit.findUnique({ where: { visitId } });

  if (!visit) {
    throw ApiError.notFound('Visit request not found.');
  }

  const data = createGatePassData(visit);
  // Upsert or create GatePass
  const gatePass = await db.gatePass.upsert({
    where: { visitId },
    update: data,
    create: {
      visitId,
      ...data,
    },
  });

  return gatePass;
}

async function verifyGatePass(tokenOrPassNumber) {
  const includeRelations = {
    visit: {
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
            isBlacklisted: true,
          },
        },
        hostEmployee: {
          select: {
            firstName: true,
            lastName: true,
            designation: true,
          },
        },
        department: {
          select: {
            departmentName: true,
          },
        },
      },
    },
  };

  // Try finding by qrToken first (the 64-char hex string embedded in the QR code)
  let gatePass = await prisma.gatePass.findUnique({
    where: { qrToken: tokenOrPassNumber },
    include: includeRelations,
  });

  // If not found, try by passNumber (the human-readable GP-YYYYMMDD-NNNN code)
  if (!gatePass) {
    gatePass = await prisma.gatePass.findUnique({
      where: { passNumber: tokenOrPassNumber },
      include: includeRelations,
    });
  }

  if (!gatePass) {
    throw ApiError.notFound('Invalid gate pass or QR code.');
  }

  if (gatePass.status !== 'ACTIVE') {
    throw ApiError.forbidden(`This gate pass is no longer active. Status: ${gatePass.status}`);
  }

  const now = new Date();
  if (now < gatePass.validFrom) {
    const formattedFrom = new Date(gatePass.validFrom).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    throw ApiError.forbidden(`This gate pass is scheduled for a future date (${formattedFrom}) and is not active yet.`);
  }

  if (now > gatePass.validUntil) {
    const formattedUntil = new Date(gatePass.validUntil).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    throw ApiError.forbidden(`This gate pass expired on ${formattedUntil} and is no longer valid.`);
  }

  if (gatePass.visit.visitor.isBlacklisted) {
    throw ApiError.forbidden('This visitor has been blacklisted since the gate pass was issued.');
  }

  return gatePass;
}

module.exports = {
  generateGatePass,
  createGatePassData,
  verifyGatePass,
};
