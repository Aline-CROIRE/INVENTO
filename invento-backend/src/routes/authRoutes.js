const express = require('express');
const router = express.Router();
const { login, createUser, setupPassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: User login
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/setup-password:
 *   post:
 *     tags: [Auth]
 *     summary: Set password using email token
 */
router.post('/setup-password', setupPassword);

/**
 * @openapi
 * /api/auth/users:
 *   post:
 *     tags: [Auth]
 *     summary: Admin creates Owner or Owner creates Worker
 *     security: [{ bearerAuth: [] }]
 */
router.post('/users', protect, authorize('ADMIN', 'OWNER'), createUser);

module.exports = router;