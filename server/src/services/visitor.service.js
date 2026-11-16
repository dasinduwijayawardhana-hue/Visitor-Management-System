/**
 * visitor.service.js
 * =====================================================================
 * KEY SECURITY FIX (Task: identity-based blacklist enforcement)
 *
 * BEFORE: create() only checked the uq_visitor_id_proof unique constraint.
 *         A blacklisted person could bypass restrictions by registering
 *         with a different ID proof type/number combination or a new phone.
 *
 * AFTER:  create() calls blacklistService.checkIdentity() FIRST.
 *         If idProofNumber OR phone matches any ACTIVE blacklist entry →
 *         HTTP 403 is thrown before any DB write happens.
 *         This check runs entirely in the backend and cannot be bypassed
 *         by calling the API directly.
 *
 * setBlacklist() now also writes to the blacklisted_persons table so
 * the two stores are always in sync.
 * =====================================================================
 */
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const blacklistService = require('./blacklist.service');

async function list({ page = 1, limit = 20, q, phone } = {}) {
  const skip = (page - 1) * limit;
  const where = {};
  if (phone) where.phone = { contains: phone };
  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { email: { contains: q } },
      { companyName: { contains: q } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.visitor.findMany({ where, skip, take: limit, orderBy: { lastName: 'asc' } }),
    prisma.visitor.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function getById(id) {
  const visitor = await prisma.visitor.findUnique({ where: { visitorId: id } });
  if (!visitor) throw ApiError.notFound('Visitor not found.');
  return visitor;
}

// -----------------------------------------------------------------------
// CREATE  — enforces blacklist check BEFORE any DB write
// -----------------------------------------------------------------------
async function create(data) {
  // ------ STEP 1: Identity-based blacklist check ----------------------
  // This is the root-cause fix. We check idProofNumber and phone against
  // the blacklisted_persons table BEFORE allowing a new visitor row to
  // be created. This prevents bypass via new visitor records.
  const blacklistEntry = await blacklistService.checkIdentity({
    idProofNumber: data.idProofNumber,
    phone: data.phone,
  });

  if (blacklistEntry) {
    // Build a rich error so the frontend can display the alert panel
    throw new ApiError(403, 'This visitor is blacklisted and cannot be registered.', {
      blacklisted: true,
      blacklistId: blacklistEntry.id,
      fullName: blacklistEntry.fullName,
      blacklistReason: blacklistEntry.blacklistReason,
      matchedOn: blacklistEntry.idProofNumber === (data.idProofNumber || '').trim()
        ? 'ID proof number'
        : 'phone number',
    });
  }

  // ------ STEP 2: Duplicate ID proof check ----------------------------
  // Design intent: visitors are a reusable master directory — don't
  // create duplicate identities, point the caller at the existing record.
  const existing = await prisma.visitor.findUnique({
    where: { uq_visitor_id_proof: { idProofType: data.idProofType, idProofNumber: data.idProofNumber } },
  });
  if (existing) {
    throw ApiError.conflict(
      `A visitor with this ID proof already exists (visitorId ${existing.visitorId}). Use that record instead of creating a duplicate.`
    );
  }

  return prisma.visitor.create({ data });
}

async function update(id, data) {
  await getById(id);
  return prisma.visitor.update({ where: { visitorId: id }, data });
}

async function remove(id) {
  await getById(id);
  try {
    await prisma.visitor.delete({ where: { visitorId: id } });
  } catch (err) {
    if (err.code === 'P2003') {
      throw ApiError.conflict('Cannot delete: this visitor has visit history. Consider blacklisting instead.');
    }
    throw err;
  }
}

// -----------------------------------------------------------------------
// SET BLACKLIST  — syncs BOTH visitor.isBlacklisted AND blacklisted_persons
// -----------------------------------------------------------------------
/**
 * @param {number} id          - visitorId
 * @param {boolean} isBlacklisted
 * @param {string}  reason     - Required when blacklisting
 * @param {number}  adminUserId
 */
async function setBlacklist(id, isBlacklisted, reason, adminUserId) {
  const visitor = await getById(id);

  if (isBlacklisted) {
    if (!reason || !reason.trim()) {
      throw ApiError.badRequest('A reason is required when blacklisting a visitor.');
    }
    // Write to the central blacklist table (creates or updates existing entry)
    await blacklistService.addToBlacklist(
      {
        visitorId: id,
        fullName: `${visitor.firstName} ${visitor.lastName}`,
        idProofType: visitor.idProofType,
        idProofNumber: visitor.idProofNumber,
        phone: visitor.phone,
        blacklistReason: reason.trim(),
      },
      adminUserId
    );
    // visitor.isBlacklisted is updated inside the transaction in addToBlacklist,
    // but we do a final read to return the fresh record.
    return prisma.visitor.findUnique({ where: { visitorId: id } });
  } else {
    // Remove from blacklist — find the ACTIVE entry by visitorId
    const activeEntry = await prisma.blacklistedPerson.findFirst({
      where: { visitorId: id, status: 'ACTIVE' },
    });
    if (activeEntry) {
      await blacklistService.removeFromBlacklist(activeEntry.id, adminUserId);
    } else {
      // No central entry — just clear the flag directly (legacy records)
      await prisma.visitor.update({ where: { visitorId: id }, data: { isBlacklisted: false } });
    }
    return prisma.visitor.findUnique({ where: { visitorId: id } });
  }
}

module.exports = { list, getById, create, update, remove, setBlacklist };
