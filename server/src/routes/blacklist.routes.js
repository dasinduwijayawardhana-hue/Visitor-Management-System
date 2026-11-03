const router = require('express').Router();
const controller = require('../controllers/blacklist.controller');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const schema = require('../validators/blacklist.validator');

router.use(authenticate);

/**
 * @swagger
 * /api/blacklist:
 *   get:
 *     tags: [Blacklist]
 *     summary: List all blacklisted persons (Admin only)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, REMOVED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Blacklist records }
 *   post:
 *     tags: [Blacklist]
 *     summary: Add a person to the blacklist (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, blacklistReason]
 *             properties:
 *               visitorId: { type: integer }
 *               fullName: { type: string }
 *               idProofType: { type: string }
 *               idProofNumber: { type: string }
 *               phone: { type: string }
 *               blacklistReason: { type: string }
 *     responses:
 *       201: { description: Person blacklisted }
 */
router.get('/', authorize('Admin'), validate(schema.listQuery, 'query'), controller.list);
router.post('/', authorize('Admin'), validate(schema.add), controller.add);

/**
 * @swagger
 * /api/blacklist/check:
 *   get:
 *     tags: [Blacklist]
 *     summary: Check if an identity is blacklisted (Admin, Security Officer)
 *     parameters:
 *       - in: query
 *         name: idProofNumber
 *         schema: { type: string }
 *       - in: query
 *         name: phone
 *         schema: { type: string }
 *     responses:
 *       200: { description: Blacklist check result }
 */
router.get('/check', authorize('Admin', 'Security Officer'), validate(schema.check, 'query'), controller.check);

/**
 * @swagger
 * /api/blacklist/{id}:
 *   delete:
 *     tags: [Blacklist]
 *     summary: Remove a blacklist entry (Admin only, sets status=REMOVED)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Blacklist entry removed }
 */
router.delete('/:id', authorize('Admin'), validate(schema.idParam, 'params'), controller.remove);

module.exports = router;
