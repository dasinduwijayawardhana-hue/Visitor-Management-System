const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function sanitize(user) {
  const safe = { ...user };
  delete safe.passwordHash;
  return { ...safe, role: user.role?.roleName || safe.role };
}

async function list({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.user.findMany({ skip, take: limit, include: { role: true }, orderBy: { userId: 'asc' } }),
    prisma.user.count(),
  ]);
  return { items: items.map(sanitize), total, page, limit };
}

async function getById(id) {
  const user = await prisma.user.findUnique({ where: { userId: id }, include: { role: true } });
  if (!user) throw ApiError.notFound('User not found.');
  return sanitize(user);
}

async function create(data) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ username: data.username }, { email: data.email }] } });
  if (existing) throw ApiError.conflict('Username or email already in use.');

  const role = await prisma.role.findUnique({ where: { roleId: data.roleId } });
  if (!role) throw ApiError.badRequest('roleId does not reference an existing role.');

  const passwordHash = await bcrypt.hash(data.password, env.bcrypt.saltRounds);
  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone || null,
      roleId: data.roleId,
      isActive: data.isActive ?? true,
    },
    include: { role: true },
  });
  return sanitize(user);
}

async function update(id, data) {
  await getById(id); // 404s if missing
  if (data.roleId) {
    const role = await prisma.role.findUnique({ where: { roleId: data.roleId } });
    if (!role) throw ApiError.badRequest('roleId does not reference an existing role.');
  }
  const user = await prisma.user.update({ where: { userId: id }, data, include: { role: true } });
  return sanitize(user);
}

async function remove(id) {
  await getById(id);
  // Note: FK rules use RESTRICT on core references; SET NULL only for
  // employees.user_id, visits.approved_by/checked_in_by/checked_out_by,
  // and logs.user_id — so deleting a user preserves audit/visit history.
  await prisma.user.delete({ where: { userId: id } });
}

async function changePassword(id, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { userId: id } });
  if (!user) throw ApiError.notFound('User not found.');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect.');

  const passwordHash = await bcrypt.hash(newPassword, env.bcrypt.saltRounds);
  await prisma.user.update({ where: { userId: id }, data: { passwordHash } });
}

module.exports = { list, getById, create, update, remove, changePassword, sanitize };
