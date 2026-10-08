const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Access tokens: short-lived, sent on every request (Authorization header).
 * Refresh tokens: long-lived, used only to mint new access tokens.
 * Keeping them on separate secrets means a leaked access token can't be
 * used to forge a refresh token and vice versa.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
