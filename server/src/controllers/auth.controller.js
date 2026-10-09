const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body, req);
  new ApiResponse(201, 'User registered successfully.', user).send(res);
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, req);
  new ApiResponse(200, 'Login successful.', { user, accessToken, refreshToken }).send(res);
});

const refresh = asyncHandler(async (req, res) => {
  const { accessToken } = await authService.refresh(req.body.refreshToken);
  new ApiResponse(200, 'Access token refreshed.', { accessToken }).send(res);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout({ userId: req.user.userId, accessToken: req.token }, req);
  new ApiResponse(200, 'Logged out successfully.').send(res);
});

const me = asyncHandler(async (req, res) => {
  new ApiResponse(200, 'Current user profile.', req.user).send(res);
});

module.exports = { register, login, refresh, logout, me };
