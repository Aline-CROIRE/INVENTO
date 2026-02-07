const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// --- PUBLIC ROUTES ---
router.post('/login', authController.login);
router.post('/setup-password', authController.setupPassword);

// --- PROTECTED STATUS (Heartbeat for TopBar Pulse) ---
router.get('/status', protect, authController.checkStatus);

// --- SETTINGS HUB ROUTES ---
router.patch('/update-profile', protect, authController.updateProfile);
router.patch('/update-password', protect, authController.updatePassword);

// --- USER MANAGEMENT ---
router.get('/users', protect, authorize('ADMIN', 'OWNER'), authController.getUsers);
router.post('/users', protect, authorize('ADMIN', 'OWNER'), authController.createUser);
router.patch('/users/:id/status', protect, authorize('ADMIN', 'OWNER'), authController.toggleUserStatus);
router.delete('/users/:id', protect, authorize('ADMIN', 'OWNER'), authController.deleteUser);

module.exports = router;