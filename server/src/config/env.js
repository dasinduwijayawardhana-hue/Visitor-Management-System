// Loads and validates environment variables in one place so the rest of
// the app never touches `process.env` directly (easier to test & reason about).
require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // Fail fast on boot rather than crashing later mid-request.
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 30,
    disabled: process.env.RATE_LIMIT_DISABLED === 'true',
  },

  // SECURITY FIX (bug audit): this previously defaulted to '*' — a
  // wildcard origin combined with `credentials: true` in app.js's cors()
  // call means any website could make authenticated, cookie/token-bearing
  // requests against this API if CORS_ORIGIN was ever left unset (e.g. a
  // rushed deploy). Defaulting to the known local frontend origin instead
  // means a missing env var fails closed (blocks unknown origins) rather
  // than failing open (allows everyone). Production deployments should
  // still set CORS_ORIGIN explicitly to their real frontend URL.
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  logLevel: process.env.LOG_LEVEL || 'info',
};
