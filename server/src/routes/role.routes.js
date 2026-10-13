const router = require('express').Router();
const controller = require('../controllers/role.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(authenticate);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Retrieve active system roles (Admin, Security Officer)
 *     responses:
 *       200: { description: List of roles }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router.get('/', authorize('Admin', 'Security Officer'), controller.list);

module.exports = router;
