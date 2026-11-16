const ApiError = require('../utils/ApiError');

/**
 * Restricts a route to a set of allowed roles.
 * Must run AFTER authenticate() so req.user is populated.
 *
 * Usage: router.delete('/:id', authenticate, authorize('Admin'), controller.remove)
 *        router.post('/checkin', authenticate, authorize('Admin', 'Security Officer'), ...)
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    // authenticate() should always run first; this guards against misuse.
    return next(ApiError.unauthorized('Authentication required before authorization check.'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      ApiError.forbidden(
        `Role '${req.user.role}' is not permitted to perform this action. Requires: ${allowedRoles.join(', ')}`
      )
    );
  }

  next();
};

module.exports = authorize;
