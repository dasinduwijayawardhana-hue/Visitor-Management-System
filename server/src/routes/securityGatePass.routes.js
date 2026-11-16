const router = require('express').Router();
const securityGatePassController = require('../controllers/securityGatePass.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(authenticate);
router.use(authorize('Security Officer', 'Admin'));

router.post('/verify-gate-pass', securityGatePassController.verifyGatePass);
router.post('/visits/:id/check-in', securityGatePassController.checkIn);
router.post('/visits/:id/check-out', securityGatePassController.checkOut);

module.exports = router;
