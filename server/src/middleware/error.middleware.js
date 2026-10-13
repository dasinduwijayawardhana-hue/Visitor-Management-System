const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const env = require('../config/env');

/**
 * Translates known Prisma errors into clean ApiErrors so callers never see
 * raw SQL/Prisma internals (also avoids leaking schema details).
 */
function normalizePrismaError(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // unique constraint violation
        return ApiError.conflict(`A record with this ${err.meta?.target?.join(', ') || 'value'} already exists.`);
      case 'P2003': // foreign key constraint failed
        return ApiError.badRequest('Invalid reference: related record does not exist.');
      case 'P2025': // record not found for update/delete
        return ApiError.notFound('Record not found.');
      case 'P2014':
        return ApiError.badRequest('The change you requested would violate a required relation.');
      default:
        return ApiError.internal('Database error occurred.');
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest('Invalid data supplied to the database layer.');
  }
  return null;
}

// 404 handler for unmatched routes — placed after all routes in app.js.
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, _next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    const prismaError = normalizePrismaError(err);
    if (prismaError) {
      error = prismaError;
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Invalid or expired token.');
    } else {
      // Unexpected/programmer error — do not leak internals to the client.
      error = ApiError.internal(env.nodeEnv === 'development' ? err.message : 'Internal server error');
    }
  }

  const statusCode = error.statusCode || 500;

  // Log server errors as errors; expected 4xx client errors as warnings.
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode}: ${err.stack || err.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${error.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
    ...(error.details ? { errors: error.details } : {}),
    ...(env.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler, notFoundHandler };
