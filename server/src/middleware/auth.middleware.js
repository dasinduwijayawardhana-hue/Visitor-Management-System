const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');
const tokenBlacklist = require('../utils/tokenBlacklist');
const prisma = require('../config/database');

/**
 * Verifies the Bearer access token, checks it hasn't been revoked
 * (logout), confirms the user still exists & is active, then attaches
 * `req.user` for downstream handlers/middleware (e.g. authorize()).
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token missing. Provide a Bearer token.');
  }

  const token = header.split(' ')[1];

  if (tokenBlacklist.isRevoked(token)) {
    throw ApiError.unauthorized('Token has been revoked. Please log in again.');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired. Please refresh your session.');
    }
    throw ApiError.unauthorized('Invalid access token.');
  }

  const user = await prisma.user.findUnique({
    where: { userId: decoded.userId },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User account is inactive or no longer exists.');
  }

  req.user = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role.roleName,
  };
  req.token = token; // needed by logout to blacklist this exact token

  next();
});

module.exports = authenticate;
