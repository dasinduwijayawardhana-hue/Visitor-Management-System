const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

async function list({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.department.findMany({ skip, take: limit, orderBy: { departmentName: 'asc' } }),
    prisma.department.count(),
  ]);
  return { items, total, page, limit };
}

async function getById(id) {
  const dept = await prisma.department.findUnique({ where: { departmentId: id } });
  if (!dept) throw ApiError.notFound('Department not found.');
  return dept;
}

async function create(data) {
  const existing = await prisma.department.findUnique({ where: { departmentName: data.departmentName } });
  if (existing) throw ApiError.conflict('A department with this name already exists.');
  return prisma.department.create({ data });
}

async function update(id, data) {
  await getById(id);
  return prisma.department.update({ where: { departmentId: id }, data });
}

async function remove(id) {
  await getById(id);
  try {
    await prisma.department.delete({ where: { departmentId: id } });
  } catch (err) {
    // FK is RESTRICT on departments <- employees/visits per the design doc.
    if (err.code === 'P2003') {
      throw ApiError.conflict(
        'Cannot delete: this department still has employees or visit records. Deactivate it instead.'
      );
    }
    throw err;
  }
}

module.exports = { list, getById, create, update, remove };
