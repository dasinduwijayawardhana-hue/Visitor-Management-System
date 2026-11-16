const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const shouldSkip = () => {
  if (env.rateLimit.disabled) return true;
  // Skip rate limiting in local development by default so developers/testers don't hit 429
  // errors while testing or reloading pages on localhost (::1).
  if (env.nodeEnv === 'development' && process.env.ENABLE_RATE_LIMIT !== 'true') {
    return true;
  }
  return false;
};

// General API limiter — applied globally.
const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: shouldSkip,
});

// Stricter limiter for /auth/login to blunt brute-force / credential-stuffing
// attempts (database_design.md section 8, requirement #1).
const loginLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  skip: shouldSkip,
});

module.exports = { apiLimiter, loginLimiter };

