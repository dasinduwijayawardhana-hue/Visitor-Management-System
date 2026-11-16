const router = require('express').Router();
const controller = require('../controllers/visitor.controller');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const schema = require('../validators/visitor.validator');

router.use(authenticate);

/**
 * @swagger
 * /api/visitors:
 *   get:
 *     tags: [Visitors]
 *     summary: Search/list visitors (Admin, Security Officer)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Free-text search across name/email/company
 *       - in: query
 *         name: phone
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of visitors }
 *   post:
 *     tags: [Visitors]
 *     summary: Register a new visitor (Admin, Security Officer)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, phone, idProofType, idProofNumber]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               companyName: { type: string }
 *               idProofType: { type: string, enum: [NATIONAL_ID, PASSPORT, DRIVER_LICENSE, EMPLOYEE_ID, OTHER] }
 *               idProofNumber: { type: string }
 *               address: { type: string }
 *     responses:
 *       201: { description: Visitor registered }
 *       409: { description: Visitor with this ID proof already exists }
 */
router.get('/', authorize('Admin', 'Security Officer'), validate(schema.search, 'query'), controller.list);
router.post('/', authorize('Admin', 'Security Officer'), validate(schema.create), controller.create);

/**
 * @swagger
 * /api/visitors/{id}:
 *   get:
 *     tags: [Visitors]
 *     summary: Get a visitor by ID (Admin, Security Officer)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Visitor found }
 *   put:
 *     tags: [Visitors]
 *     summary: Update visitor details (Admin, Security Officer)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Visitor updated }
 *   delete:
 *     tags: [Visitors]
 *     summary: Delete a visitor (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Visitor deleted }
 */
router.get('/:id', authorize('Admin', 'Security Officer'), validate(schema.idParam, 'params'), controller.getById);
router.put(
  '/:id',
  authorize('Admin', 'Security Officer'),
  validate(schema.idParam, 'params'),
  validate(schema.update),
  controller.update
);
router.delete('/:id', authorize('Admin'), validate(schema.idParam, 'params'), controller.remove);

/**
 * @swagger
 * /api/visitors/{id}/blacklist:
 *   patch:
 *     tags: [Visitors]
 *     summary: Blacklist or un-blacklist a visitor (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isBlacklisted]
 *             properties:
 *               isBlacklisted: { type: boolean }
 *     responses:
 *       200: { description: Blacklist status updated }
 */
router.patch('/:id/blacklist', authorize('Admin'), validate(schema.idParam, 'params'), validate(schema.blacklistPatch), controller.setBlacklist);

module.exports = router;
