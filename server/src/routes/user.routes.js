const router = require('express').Router();
const controller = require('../controllers/user.controller');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const schema = require('../validators/user.validator');

router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: List of users }
 *       403: { description: Forbidden }
 *   post:
 *     tags: [Users]
 *     summary: Create a user (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, fullName, roleId]
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               fullName: { type: string }
 *               phone: { type: string }
 *               roleId: { type: integer }
 *     responses:
 *       201: { description: User created }
 */
router.get('/', authorize('Admin'), controller.list);
router.post('/', authorize('Admin'), validate(schema.create), controller.create);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User found }
 *       404: { description: Not found }
 *   put:
 *     tags: [Users]
 *     summary: Update a user (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User updated }
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User deleted }
 */
router.get('/:id', authorize('Admin'), validate(schema.idParam, 'params'), controller.getById);
router.put('/:id', authorize('Admin'), validate(schema.idParam, 'params'), validate(schema.update), controller.update);
router.delete('/:id', authorize('Admin'), validate(schema.idParam, 'params'), controller.remove);

/**
 * @swagger
 * /api/users/{id}/change-password:
 *   patch:
 *     tags: [Users]
 *     summary: Change a user's password (self or Admin)
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
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password changed }
 */
router.patch(
  '/:id/change-password',
  validate(schema.idParam, 'params'),
  validate(schema.changePassword),
  controller.changePassword
);

module.exports = router;
