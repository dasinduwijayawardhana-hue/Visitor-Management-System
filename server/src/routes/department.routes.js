const router = require('express').Router();
const controller = require('../controllers/department.controller');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const schema = require('../validators/department.validator');

router.use(authenticate);

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [Departments]
 *     summary: List departments (any authenticated role)
 *     responses:
 *       200: { description: List of departments }
 *   post:
 *     tags: [Departments]
 *     summary: Create a department (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [departmentName]
 *             properties:
 *               departmentName: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *     responses:
 *       201: { description: Department created }
 */
router.get('/', controller.list);
router.post('/', authorize('Admin'), validate(schema.create), controller.create);

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Get a department by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Department found }
 *   put:
 *     tags: [Departments]
 *     summary: Update a department (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Department updated }
 *   delete:
 *     tags: [Departments]
 *     summary: Delete a department (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Department deleted }
 */
router.get('/:id', validate(schema.idParam, 'params'), controller.getById);
router.put('/:id', authorize('Admin'), validate(schema.idParam, 'params'), validate(schema.update), controller.update);
router.delete('/:id', authorize('Admin'), validate(schema.idParam, 'params'), controller.remove);

module.exports = router;
