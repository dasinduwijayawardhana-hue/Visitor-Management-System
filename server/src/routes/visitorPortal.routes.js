const router = require('express').Router();
const visitorPortalController = require('../controllers/visitorPortal.controller');
const { registerSchema, updateProfileSchema, createVisitRequestSchema } = require('../validators/visitorPortal.validator');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { uploadVisitorPhoto } = require('../middleware/upload.middleware');

// Public route: Visitor Registration
router.post('/register', uploadVisitorPhoto, (req, res, next) => {
  // Joi needs object values, so parse fields before Joi validation if multipart/form-data
  // since multer populated req.body as strings
  next();
}, validate(registerSchema), visitorPortalController.register);

// Protected routes (Visitor only)
router.use(authenticate);
router.use(authorize('Visitor'));

router.get('/profile', visitorPortalController.getProfile);
router.put('/profile', uploadVisitorPhoto, validate(updateProfileSchema), visitorPortalController.updateProfile);
router.get('/employees', visitorPortalController.getEmployees);
router.get('/visits', visitorPortalController.getVisits);
router.post('/visits', validate(createVisitRequestSchema), visitorPortalController.createVisitRequest);
router.get('/visits/:id', visitorPortalController.getVisitById);
router.put('/visits/:id/cancel', visitorPortalController.cancelVisit);

module.exports = router;
