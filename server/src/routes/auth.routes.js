const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');
const schema = require('../validators/auth.validator');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user (defaults to the Employee role)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, fullName]
 *             properties:
 *               username: { type: string, example: jdoe }
 *               email: { type: string, example: jdoe@example.com }
 *               password: { type: string, example: SecurePass1 }
 *               fullName: { type: string, example: John Doe }
 *               phone: { type: string, example: "+1-555-0100" }
 *     responses:
 *       201: { description: User registered }
 *       409: { description: Username or email already exists }
 */
router.post('/register', validate(schema.register), controller.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive access + refresh tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: jdoe }
 *               password: { type: string, example: SecurePass1 }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', loginLimiter, validate(schema.login), controller.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Invalid or expired refresh token }
 */
router.post('/refresh', validate(schema.refresh), controller.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out (revokes the current access token)
 *     responses:
 *       200: { description: Logged out }
 *       401: { description: Not authenticated }
 */
router.post('/logout', authenticate, controller.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user's profile
 *     responses:
 *       200: { description: Current user profile }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticate, controller.me);

module.exports = router;
