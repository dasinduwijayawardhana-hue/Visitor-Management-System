/**
 * Wraps an async Express route handler so any rejected promise / thrown
 * error is automatically forwarded to next() -> the global error middleware.
 * Without this, every controller would need its own try/catch block.
 *
 * Usage: router.get('/', asyncHandler(controller.list));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
