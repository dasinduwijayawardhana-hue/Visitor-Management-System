const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcrypt');
const env = require('../config/env');

const includeRelations = {
  department: { select: { departmentId: true, departmentName: true } },
  user: { select: { userId: true, username: true, email: true } },
};

async function list({ page = 1, limit = 20, departmentId } = {}) {
  const skip = (page - 1) * limit;
  const where = departmentId ? { departmentId } : {};
  const [items, total] = await Promise.all([
    prisma.employee.findMany({ where, skip, take: limit, include: includeRelations, orderBy: { lastName: 'asc' } }),
    prisma.employee.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function getById(id) {
  const emp = await prisma.employee.findUnique({ where: { employeeId: id }, include: includeRelations });
  if (!emp) throw ApiError.notFound('Employee not found.');
  return emp;
}

async function create(data) {
  return await prisma.$transaction(async (tx) => {
    const dept = await tx.department.findUnique({ where: { departmentId: data.departmentId } });
    if (!dept) throw ApiError.badRequest('departmentId does not reference an existing department.');

    const existing = await tx.employee.findFirst({
      where: { OR: [{ employeeCode: data.employeeCode }, { email: data.email }] },
    });
    if (existing) throw ApiError.conflict('Employee code or email already in use.');

    let userId = data.userId;

    if (data.password) {
      const existingUser = await tx.user.findFirst({
        where: { OR: [{ username: data.email }, { email: data.email }] }
      });
      if (existingUser) throw ApiError.conflict('User with this email already exists.');

      const role = await tx.role.findUnique({ where: { roleName: 'Employee' } });
      if (!role) throw ApiError.internal('Role "Employee" not found in the database.');

      const passwordHash = await bcrypt.hash(data.password, env.bcrypt.saltRounds);

      const user = await tx.user.create({
        data: {
          username: data.email,
          email: data.email,
          passwordHash,
          roleId: role.roleId,
          fullName: `${data.firstName} ${data.lastName}`,
          phone: data.phone || null,
        }
      });
      userId = user.userId;
    } else if (userId) {
      const linkedUser = await tx.user.findUnique({ where: { userId } });
      if (!linkedUser) throw ApiError.badRequest('userId does not reference an existing user.');
      const alreadyLinked = await tx.employee.findUnique({ where: { userId } });
      if (alreadyLinked) throw ApiError.conflict('This user account is already linked to another employee.');
    }

    const empData = { ...data };
    delete empData.password;
    delete empData.confirmPassword;
    empData.userId = userId;

    return tx.employee.create({ data: empData, include: includeRelations });
  });
}

async function update(id, data) {
  await getById(id);
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { departmentId: data.departmentId } });
    if (!dept) throw ApiError.badRequest('departmentId does not reference an existing department.');
  }
  return prisma.employee.update({ where: { employeeId: id }, data, include: includeRelations });
}

async function remove(id) {
  await getById(id);
  try {
    await prisma.employee.delete({ where: { employeeId: id } });
  } catch (err) {
    if (err.code === 'P2003') {
      throw ApiError.conflict('Cannot delete: this employee is a host on existing visit records. Deactivate instead.');
    }
    throw err;
  }
}

// "View assigned visitors" — an Employee's own hosted visits.
async function getVisitsForEmployeeUser(userId, { page = 1, limit = 20 } = {}) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw ApiError.notFound('No employee profile is linked to this account.');

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.visit.findMany({
      where: { hostEmployeeId: employee.employeeId },
      skip,
      take: limit,
      include: { visitor: true, department: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.visit.count({ where: { hostEmployeeId: employee.employeeId } }),
  ]);
  return { items, total, page, limit };
}

module.exports = { list, getById, create, update, remove, getVisitsForEmployeeUser };
