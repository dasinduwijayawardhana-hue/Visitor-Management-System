const router = require('express').Router();
const controller = require('../controllers/report.controller');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const schema = require('../validators/report.validator');

router.use(authenticate, authorize('Admin', 'Security Officer'));

/**
 * @swagger
 * /api/reports/daily:
 *   get:
 *     tags: [Reports]
 *     summary: Daily visitor report (Admin, Security Officer)
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: "2026-07-20" }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *     responses:
 *       200: { description: Daily report (JSON, CSV, or PDF depending on format) }
 */
router.get('/daily', validate(schema.dailyReport, 'query'), controller.daily);

/**
 * @swagger
 * /api/reports/monthly:
 *   get:
 *     tags: [Reports]
 *     summary: Monthly visitor report (Admin, Security Officer)
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: integer, example: 2026 }
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: integer, example: 7 }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *     responses:
 *       200: { description: Monthly report (JSON, CSV, or PDF depending on format) }
 */
router.get('/monthly', validate(schema.monthlyReport, 'query'), controller.monthly);

/**
 * @swagger
 * /api/reports/current-visitors:
 *   get:
 *     tags: [Reports]
 *     summary: Report of visitors currently inside the facility
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv, pdf], default: json }
 *     responses:
 *       200: { description: Current visitors report }
 */
router.get('/current-visitors', controller.currentVisitors);

module.exports = router;
