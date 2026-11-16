const prisma = require('../config/database');

async function list() {
  return prisma.role.findMany({
    orderBy: { roleId: 'asc' },
  });
}

module.exports = { list };
