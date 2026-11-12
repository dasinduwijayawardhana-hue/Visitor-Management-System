const router = require('express').Router();
const employeeApprovalController = require('../controllers/employeeApproval.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(authenticate);
router.use(authorize('Employee', 'Admin'));

router.get('/visitor-requests', employeeApprovalController.getVisitorRequests);
router.put('/visitor-requests/:id/approve', employeeApprovalController.approveRequest);
router.put('/visitor-requests/:id/reject', employeeApprovalController.rejectRequest);

module.exports = router;
