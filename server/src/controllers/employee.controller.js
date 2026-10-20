const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const employeeService = require('../services/employee.service');
const logService = require('../services/log.service');
const { uploadProfileImage } = require('../middleware/upload.middleware');
const fs = require('fs');
const path = require('path');

const list = asyncHandler(async (req, res) => {
  const { page, limit, departmentId } = req.query;
  const result = await employeeService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    departmentId: departmentId ? Number(departmentId) : undefined,
  });
  new ApiResponse(200, 'Employees retrieved.', result.items, { total: result.total, page: result.page, limit: result.limit }).send(res);
});

const getById = asyncHandler(async (req, res) => {
  const emp = await employeeService.getById(Number(req.params.id));
  new ApiResponse(200, 'Employee retrieved.', emp).send(res);
});

// Wraps multer then runs the real create logic so we can handle upload errors cleanly.
const create = (req, res, next) => {
  uploadProfileImage(req, res, async (uploadErr) => {
    try {
      if (uploadErr) {
        // Remove any partially-uploaded file
        if (req.file) fs.unlink(req.file.path, () => {});
        throw ApiError.badRequest(uploadErr.message || 'File upload failed.');
      }

      // Parse JSON fields that were sent as FormData strings
      const departmentId = Number(req.body.departmentId);
      const userId = req.body.userId ? Number(req.body.userId) : undefined;

      const data = {
        employeeCode: req.body.employeeCode,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        phone: req.body.phone || undefined,
        designation: req.body.designation || undefined,
        departmentId,
        ...(userId ? { userId } : {}),
        ...(req.file ? { profileImage: req.file.filename } : {}),
      };

      const emp = await employeeService.create(data);
      await logService.record({
        userId: req.user.userId,
        action: 'CREATE',
        entityType: 'Employee',
        entityId: emp.employeeId,
        description: `Created employee ${emp.employeeCode}`,
        req,
      });
      new ApiResponse(201, 'Employee created.', emp).send(res);
    } catch (err) {
      // If DB create fails, clean up the uploaded file so we don't litter /uploads
      if (req.file) fs.unlink(req.file.path, () => {});
      next(err);
    }
  });
};

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const emp = await employeeService.update(id, req.body);
  await logService.record({ userId: req.user.userId, action: 'UPDATE', entityType: 'Employee', entityId: id, req });
  new ApiResponse(200, 'Employee updated.', emp).send(res);
});

// Upload-aware update: handles optional new profile image during PUT
const updateWithImage = (req, res, next) => {
  uploadProfileImage(req, res, async (uploadErr) => {
    try {
      if (uploadErr) {
        if (req.file) fs.unlink(req.file.path, () => {});
        throw ApiError.badRequest(uploadErr.message || 'File upload failed.');
      }

      const id = Number(req.params.id);

      // Build the update payload from body fields
      const data = {};
      if (req.body.employeeCode !== undefined) data.employeeCode = req.body.employeeCode;
      if (req.body.firstName !== undefined) data.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) data.lastName = req.body.lastName;
      if (req.body.email !== undefined) data.email = req.body.email;
      if (req.body.phone !== undefined) data.phone = req.body.phone;
      if (req.body.designation !== undefined) data.designation = req.body.designation;
      if (req.body.departmentId !== undefined) data.departmentId = Number(req.body.departmentId);
      if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true' || req.body.isActive === true;

      if (req.file) {
        // Delete old image if it exists so /uploads doesn't grow unboundedly
        const existing = await employeeService.getById(id);
        if (existing.profileImage) {
          const oldPath = path.join(__dirname, '../../uploads/employees', existing.profileImage);
          fs.unlink(oldPath, () => {});
        }
        data.profileImage = req.file.filename;
      }

      const emp = await employeeService.update(id, data);
      await logService.record({ userId: req.user.userId, action: 'UPDATE', entityType: 'Employee', entityId: id, req });
      new ApiResponse(200, 'Employee updated.', emp).send(res);
    } catch (err) {
      if (req.file) fs.unlink(req.file.path, () => {});
      next(err);
    }
  });
};

const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  // Clean up profile image on delete
  try {
    const emp = await employeeService.getById(id);
    if (emp.profileImage) {
      const imgPath = path.join(__dirname, '../../uploads/employees', emp.profileImage);
      fs.unlink(imgPath, () => {});
    }
  } catch (_) { /* ignore */ }

  await employeeService.remove(id);
  await logService.record({ userId: req.user.userId, action: 'DELETE', entityType: 'Employee', entityId: id, req });
  new ApiResponse(200, 'Employee deleted.').send(res);
});

// Employee role: "View assigned visitors" — visits they are hosting.
const myVisitors = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await employeeService.getVisitsForEmployeeUser(req.user.userId, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  new ApiResponse(200, 'Your assigned visitors retrieved.', result.items, { total: result.total, page: result.page, limit: result.limit }).send(res);
});

module.exports = { list, getById, create, update, updateWithImage, remove, myVisitors };
