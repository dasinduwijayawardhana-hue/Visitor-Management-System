/**
 * blacklist.service.js
 * =====================================================================
 * Identity-anchored blacklist service.
 *
 * ROOT CAUSE the old system missed:
 *   - isBlacklisted was stored on the VISITOR row.
 *   - A new visitor row with different details bypassed the flag.
 *
 * FIX:
 *   - All blacklists are now stored in `blacklisted_persons` keyed
 *     on identity fields (idProofNumber, phone) NOT on visitor_id.
 *   - checkIdentity() is called BEFORE any visitor is created so
 *     no new row can ever be created for a blacklisted identity.
 * =====================================================================
 */
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

// -------------------------------------------------------------------
// IDENTITY CHECK  (the critical security hot-path)
// -------------------------------------------------------------------
/**
 * Checks whether any combination of the supplied identity fields
 * matches an ACTIVE blacklist entry.
 *
 * Priority order:
 *   1. idProofNumber  (highest — government-issued, hard to change)
 *   2. phone          (secondary — can change, but still a signal)
 *
 * Returns the matching BlacklistedPerson record, or null if clear.
 */
async function checkIdentity({ idProofNumber, phone } = {}) {
  const orConditions = [];

  if (idProofNumber && idProofNumber.trim()) {
    orConditions.push({ idProofNumber: idProofNumber.trim() });
  }
  if (phone && phone.trim()) {
    orConditions.push({ phone: phone.trim() });
  }

  if (orConditions.length === 0) return null;

  const entry = await prisma.blacklistedPerson.findFirst({
    where: {
      status: 'ACTIVE',
      OR: orConditions,
    },
    include: {
      createdByUser: { select: { userId: true, fullName: true } },
    },
  });

  return entry || null;
}

// -------------------------------------------------------------------
// ADD TO BLACKLIST  (Admin action — also called by setBlacklist)
// -------------------------------------------------------------------
/**
 * Creates a blacklisted_persons record AND sets visitor.isBlacklisted = true
 * in a single transaction so the two tables are always in sync.
 */
async function addToBlacklist(
  { visitorId, fullName, idProofType, idProofNumber, phone, blacklistReason },
  createdByUserId
) {
  return prisma.$transaction(async (tx) => {
    // Prevent duplicate ACTIVE entries for the same identity
    const existing = await tx.blacklistedPerson.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          ...(idProofNumber ? [{ idProofNumber: idProofNumber.trim() }] : []),
          ...(phone ? [{ phone: phone.trim() }] : []),
        ].filter(Boolean),
      },
    });

    let record;
    if (existing) {
      // Update the existing entry rather than creating a duplicate
      record = await tx.blacklistedPerson.update({
        where: { id: existing.id },
        data: {
          fullName,
          idProofType: idProofType || null,
          idProofNumber: idProofNumber ? idProofNumber.trim() : null,
          phone: phone ? phone.trim() : null,
          blacklistReason,
          visitorId: visitorId || existing.visitorId,
        },
      });
    } else {
      record = await tx.blacklistedPerson.create({
        data: {
          visitorId: visitorId || null,
          fullName,
          idProofType: idProofType || null,
          idProofNumber: idProofNumber ? idProofNumber.trim() : null,
          phone: phone ? phone.trim() : null,
          blacklistReason,
          status: 'ACTIVE',
          createdByUserId,
        },
      });
    }

    // Keep the visitor row flag in sync if we have a visitorId
    if (visitorId) {
      await tx.visitor.update({
        where: { visitorId },
        data: { isBlacklisted: true },
      });
    }

    return record;
  });
}

// -------------------------------------------------------------------
// REMOVE FROM BLACKLIST  (Admin action)
// -------------------------------------------------------------------
/**
 * Sets status = REMOVED on the blacklist entry and sets
 * visitor.isBlacklisted = false if the visitor still exists.
 */
async function removeFromBlacklist(id, removedByUserId) {
  const entry = await prisma.blacklistedPerson.findUnique({ where: { id } });
  if (!entry) throw ApiError.notFound('Blacklist entry not found.');
  if (entry.status === 'REMOVED') throw ApiError.conflict('This blacklist entry is already removed.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.blacklistedPerson.update({
      where: { id },
      data: { status: 'REMOVED', removedByUserId },
    });

    if (entry.visitorId) {
      // Only clear the flag if no other ACTIVE entry covers this visitor
      const stillBlacklisted = await tx.blacklistedPerson.findFirst({
        where: {
          visitorId: entry.visitorId,
          status: 'ACTIVE',
          id: { not: id },
        },
      });
      if (!stillBlacklisted) {
        await tx.visitor.update({
          where: { visitorId: entry.visitorId },
          data: { isBlacklisted: false },
        });
      }
    }

    return updated;
  });
}

// -------------------------------------------------------------------
// LIST  (Admin view)
// -------------------------------------------------------------------
async function list({ page = 1, limit = 20, status } = {}) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.blacklistedPerson.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        visitor: { select: { visitorId: true, firstName: true, lastName: true } },
        createdByUser: { select: { userId: true, fullName: true } },
        removedByUser: { select: { userId: true, fullName: true } },
      },
    }),
    prisma.blacklistedPerson.count({ where }),
  ]);

  return { items, total, page, limit };
}

// -------------------------------------------------------------------
// GET BY ID
// -------------------------------------------------------------------
async function getById(id) {
  const entry = await prisma.blacklistedPerson.findUnique({
    where: { id },
    include: {
      visitor: true,
      createdByUser: { select: { userId: true, fullName: true } },
      removedByUser: { select: { userId: true, fullName: true } },
    },
  });
  if (!entry) throw ApiError.notFound('Blacklist entry not found.');
  return entry;
}

module.exports = { checkIdentity, addToBlacklist, removeFromBlacklist, list, getById };
