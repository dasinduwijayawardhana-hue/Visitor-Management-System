const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const visitorPortalService = require('../services/visitorPortal.service');

const register = asyncHandler(async (req, res) => {
  const photoUrl = req.file ? `uploads/visitors/${req.file.filename}` : null;

  const userData = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    fullName: req.body.fullName,
    phone: req.body.phone,
  };

  const visitorData = {
    companyName: req.body.companyName,
    idProofType: req.body.idProofType,
    idProofNumber: req.body.idProofNumber,
    address: req.body.address,
    photoUrl,
  };

  const result = await visitorPortalService.register(userData, visitorData, req);
  new ApiResponse(201, 'Visitor account registered successfully.', result).send(res);
});

const getProfile = asyncHandler(async (req, res) => {
  const result = await visitorPortalService.getProfile(req.user.userId);
  new ApiResponse(200, 'Visitor profile retrieved successfully.', result).send(res);
});

const updateProfile = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  
  if (req.file) {
    updateData.photoUrl = `uploads/visitors/${req.file.filename}`;
  }

  const result = await visitorPortalService.updateProfile(req.user.userId, updateData, req);
  new ApiResponse(200, 'Profile updated successfully.', result).send(res);
});

const createVisitRequest = asyncHandler(async (req, res) => {
  const result = await visitorPortalService.createVisitRequest(req.user.userId, req.body, req);
  new ApiResponse(201, 'Visit request submitted successfully.', result).send(res);
});

const getVisits = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const result = await visitorPortalService.getVisits(req.user.userId, { page, limit });
  new ApiResponse(200, 'Visits retrieved successfully.', result.items, {
    total: result.total,
    page: result.page,
    limit: result.limit,
  }).send(res);
});

const getVisitById = asyncHandler(async (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  const result = await visitorPortalService.getVisitRequestById(req.user.userId, visitId);
  new ApiResponse(200, 'Visit request retrieved successfully.', result).send(res);
});

const cancelVisit = asyncHandler(async (req, res) => {
  const visitId = parseInt(req.params.id, 10);
  const result = await visitorPortalService.cancelVisit(req.user.userId, visitId, req);
  new ApiResponse(200, 'Visit request cancelled successfully.', result).send(res);
});

const getEmployees = asyncHandler(async (req, res) => {
  const result = await visitorPortalService.getEmployees();
  new ApiResponse(200, 'Employees retrieved successfully.', result).send(res);
});

module.exports = {
  register,
  getProfile,
  updateProfile,
  createVisitRequest,
  getVisits,
  getVisitById,
  cancelVisit,
  getEmployees,
};
