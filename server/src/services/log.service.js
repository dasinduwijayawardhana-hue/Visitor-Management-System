const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Writes an audit trail entry to the `logs` table (per database_design.md
 * section 8, requirement #7: every login, check-in/out, and CRUD action
 * should be recorded with ip_address and user_agent).
 *
 * This never throws — audit logging must not break the primary request
 * if the log write itself fails; we just log the failure to Winston.
 */
async function record({ userId = null, action, entityType = null, entityId = null, description = null, req = null }) {
  try {
    await prisma.log.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
        ipAddress: req ? req.ip : null,
        userAgent: req ? req.headers['user-agent'] : null,
      },
    });
  } catch (err) {
    logger.error(`Failed to write audit log for action "${action}": ${err.message}`);
  }
}

/**
 * Retrieves paginated audit logs with search, filtering, and user details.
 * Ordered newest-first (createdAt desc).
 */
async function list({ page = 1, limit = 20, q, userId, action, startDate, endDate } = {}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (userId) {
    where.userId = Number(userId);
  }

  if (action) {
    where.action = action;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      // Include the entire end day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (q) {
    where.OR = [
      { action: { contains: q } },
      { entityType: { contains: q } },
      { description: { contains: q } },
      { user: { username: { contains: q } } },
      { user: { fullName: { contains: q } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.log.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            fullName: true,
            role: {
              select: {
                roleName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.log.count({ where }),
  ]);

  const formattedItems = items.map((log) => ({
    logId: log.logId,
    userId: log.userId,
    username: log.user?.username || 'System',
    userFullName: log.user?.fullName || 'System',
    userRole: log.user?.role?.roleName || 'System',
    action: log.action,
    entityType: log.entityType || 'General',
    entityId: log.entityId,
    description: log.description || '',
    ipAddress: log.ipAddress || '-',
    userAgent: log.userAgent || '-',
    createdAt: log.createdAt,
  }));

  return { items: formattedItems, total, page, limit };
}

module.exports = { record, list };
