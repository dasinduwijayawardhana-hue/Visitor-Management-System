const router = require('express').Router();
const controller = require('../controllers/employee.controller');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const schema = require('../validators/employee.validator');

router.use(authenticate);

/**
 * @swagger
 * /api/employees/my-visitors:
 *   get:
 *     tags: [Employees]
 *     summary: View visitors assigned to the logged-in employee (Employee role)
 *     responses:
 *       200: { description: List of visits hosted by the current employee }
 *       404: { description: No employee profile linked to this account }
 */
router.get('/my-visitors', controller.myVisitors);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     tags: [Employees]
 *     summary: List employees (Admin, Security Officer)
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of employees }
 *   post:
 *     tags: [Employees]
 *     summary: Create an employee (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [employeeCode, firstName, lastName, email, departmentId]
 *             properties:
 *               employeeCode: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               designation: { type: string }
 *               departmentId: { type: integer }
 *               userId: { type: integer, nullable: true }
 *               profileImage: { type: string, format: binary }
 *     responses:
 *       201: { description: Employee created }
 */
router.get('/', authorize('Admin', 'Security Officer'), controller.list);
// POST uses multipart/form-data (multer handles parsing inside the controller)
router.post('/', authorize('Admin'), controller.create);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get an employee by ID (Admin, Security Officer)
 *   put:
 *     tags: [Employees]
 *     summary: Update an employee (Admin only)
 *   delete:
 *     tags: [Employees]
 *     summary: Delete an employee (Admin only)
 */
router.get('/:id', authorize('Admin', 'Security Officer'), validate(schema.idParam, 'params'), controller.getById);
// PUT also accepts multipart/form-data so an image can be changed during edit
router.put('/:id', authorize('Admin'), validate(schema.idParam, 'params'), controller.updateWithImage);
router.delete('/:id', authorize('Admin'), validate(schema.idParam, 'params'), controller.remove);

module.exports = router;
