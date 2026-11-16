const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const tokenBlacklist = require('../utils/tokenBlacklist');
const logService = require('./log.service');

const DEFAULT_SELF_SIGNUP_ROLE_NAME = 'Employee'; // public /register never grants Admin/Security Officer

function toPublicUser(user) {
  const safe = { ...user };
  delete safe.passwordHash;
  return { ...safe, role: user.role?.roleName || safe.role };
}

async function register({ username, email, password, fullName, phone }, req) {
  // Check username and email separately so the user gets a specific message
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    throw ApiError.conflict('This username is already taken. Please choose a different username.');
  }
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw ApiError.conflict('This email address is already registered. Please use a different email or log in.');
  }

  const role = await prisma.role.findUnique({ where: { roleName: DEFAULT_SELF_SIGNUP_ROLE_NAME } });
  if (!role) {
    throw ApiError.internal(`Default role "${DEFAULT_SELF_SIGNUP_ROLE_NAME}" is not seeded. Run the seed script.`);
  }

  const passwordHash = await bcrypt.hash(password, env.bcrypt.saltRounds);

  const user = await prisma.user.create({
    data: { username, email, passwordHash, fullName, phone: phone || null, roleId: role.roleId },
    include: { role: true },
  });

  await logService.record({
    userId: user.userId,
    action: 'REGISTER',
    entityType: 'User',
    entityId: user.userId,
    description: `New user registered: ${username}`,
    req,
  });

  return toPublicUser(user);
}

async function login({ username, password }, req) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: username }] },
    include: { role: true },
  });

  // Same error message for "not found" and "wrong password" — avoids
  // leaking which usernames exist (enumeration attack prevention).
  if (!user) {
    throw ApiError.unauthorized('Invalid username/email or password.');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('This account has been deactivated. Contact an administrator.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await logService.record({
      userId: user.userId,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: user.userId,
      description: 'Failed login attempt (wrong password)',
      req,
    });
    throw ApiError.unauthorized('Invalid username/email or password.');
  }

  const payload = { userId: user.userId, role: user.role.roleName };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: user.userId });

  await prisma.user.update({
    where: { userId: user.userId },
    data: { lastLoginAt: new Date() },
  });

  await logService.record({
    userId: user.userId,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.userId,
    description: 'User logged in',
    req,
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token. Please log in again.');
  }

  const user = await prisma.user.findUnique({
    where: { userId: decoded.userId },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User no longer exists or is inactive.');
  }

  const accessToken = signAccessToken({ userId: user.userId, role: user.role.roleName });
  return { accessToken };
}

async function logout({ userId, accessToken }, req) {
  tokenBlacklist.revoke(accessToken);

  await logService.record({
    userId,
    action: 'LOGOUT',
    entityType: 'User',
    entityId: userId,
    description: 'User logged out',
    req,
  });
}

module.exports = { register, login, refresh, logout, toPublicUser };
