const router = require('express').Router();
const controller = require('../controllers/visit.controller');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const schema = require('../validators/visit.validator');

router.use(authenticate);

/**
 * @swagger
 * /api/visits/currently-inside:
 *   get:
 *     tags: [Visits]
 *     summary: List visitors currently inside the facility
 *     responses:
 *       200: { description: Currently checked-in visitors with elapsed minutes }
 */
router.get('/currently-inside', authorize('Admin', 'Security Officer'), controller.currentlyInside);

/**
 * @swagger
 * /api/visits:
 *   get:
 *     tags: [Visits]
 *     summary: List visits with optional filters (Admin, Security Officer)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Pre_Registered, Checked_In, Checked_Out, Cancelled, Denied] }
 *       - in: query
 *         name: departmentId
 *         schema: { type: integer }
 *       - in: query
 *         name: hostEmployeeId
 *         schema: { type: integer }
 *       - in: query
 *         name: visitorId
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: List of visits }
 *   post:
 *     tags: [Visits]
 *     summary: Register/pre-register a visit (Admin, Security Officer)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [visitorId, hostEmployeeId, departmentId, purpose]
 *             properties:
 *               visitorId: { type: integer }
 *               hostEmployeeId: { type: integer }
 *               departmentId: { type: integer }
 *               purpose: { type: string }
 *               remarks: { type: string }
 *     responses:
 *       201: { description: Visit registered }
 *       403: { description: Visitor is blacklisted }
 */
router.get('/', authorize('Admin', 'Security Officer'), validate(schema.listQuery, 'query'), controller.list);
router.post('/', authorize('Admin', 'Security Officer'), validate(schema.create), controller.create);

/**
 * @swagger
 * /api/visits/{id}:
 *   get:
 *     tags: [Visits]
 *     summary: Get a visit by ID (Admin, Security Officer)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Visit found }
 */
router.get('/:id', authorize('Admin', 'Security Officer'), validate(schema.idParam, 'params'), controller.getById);

/**
 * @swagger
 * /api/visits/{id}/check-in:
 *   post:
 *     tags: [Visits]
 *     summary: Check in a visitor (Admin, Security Officer)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               badgeNumber: { type: string }
 *     responses:
 *       200: { description: Visitor checked in }
 *       403: { description: Visitor is blacklisted }
 */
router.post(
  '/:id/check-in',
  authorize('Admin', 'Security Officer'),
  validate(schema.idParam, 'params'),
  validate(schema.checkIn),
  controller.checkIn
);

/**
 * @swagger
 * /api/visits/{id}/check-out:
 *   post:
 *     tags: [Visits]
 *     summary: Check out a visitor (Admin, Security Officer)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks: { type: string }
 *     responses:
 *       200: { description: Visitor checked out }
 */
router.post(
  '/:id/check-out',
  authorize('Admin', 'Security Officer'),
  validate(schema.idParam, 'params'),
  validate(schema.checkOut),
  controller.checkOut
);

/**
 * @swagger
 * /api/visits/{id}/status:
 *   patch:
 *     tags: [Visits]
 *     summary: Update visit status, e.g. Cancel or Deny (Admin, Security Officer)
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
 *             required: [visitStatus]
 *             properties:
 *               visitStatus: { type: string, enum: [Pre_Registered, Checked_In, Checked_Out, Cancelled, Denied] }
 *               remarks: { type: string }
 *     responses:
 *       200: { description: Visit status updated }
 */
router.patch(
  '/:id/status',
  authorize('Admin'),
  validate(schema.idParam, 'params'),
  validate(schema.updateStatus),
  controller.updateStatus
);

module.exports = router;
