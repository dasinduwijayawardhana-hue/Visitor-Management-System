const Joi = require('joi');

const register = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().max(150).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must be at least 8 characters and include upper, lower case letters and a number')
    .required(),
  fullName: Joi.string().min(2).max(150).required(),
  phone: Joi.string()
    .pattern(/^[0-9+\-() ]{7,20}$/)
    .message('Phone must be a valid phone number')
    .allow(null, ''),
  // NOTE: no roleId here on purpose — self-signup always creates an Employee
  // (see auth.service.js#register). Admins assign other roles via POST /api/users.
});

const login = Joi.object({
  username: Joi.string().required().messages({ 'any.required': 'Username or email is required' }),
  password: Joi.string().required(),
});

const refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { register, login, refresh };
