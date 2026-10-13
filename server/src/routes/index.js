const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/departments', require('./department.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/employee', require('./employeeApproval.routes'));
router.use('/visitors', require('./visitor.routes'));
router.use('/visits', require('./visit.routes'));
router.use('/blacklist', require('./blacklist.routes'));
router.use('/reports', require('./report.routes'));
router.use('/roles', require('./role.routes'));
router.use('/visitor-portal', require('./visitorPortal.routes'));
router.use('/security', require('./securityGatePass.routes'));
router.use('/audit-logs', require('./log.routes'));
router.use('/logs', require('./log.routes'));

module.exports = router;
