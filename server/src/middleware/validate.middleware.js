const ApiError = require('../utils/ApiError');

/**
 * Generic Joi validator factory. Pass a Joi schema and which part of the
 * request to validate ('body' | 'query' | 'params').
 *
 * Usage: router.post('/', validate(visitorValidator.create), controller.create)
 */
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false, // collect all errors, not just the first
    stripUnknown: true, // drop fields not defined in the schema (defense in depth)
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, ''),
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }

  req[property] = value; // use the sanitized/coerced value going forward
  next();
};

module.exports = validate;
