const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardInsights } = require('../controllers/insightsController');

/**
 * @openapi
 * /api/insights/dashboard:
 *   get:
 *     tags: [Insights]
 *     summary: Get dashboard health score and actionable recommendations
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', protect, getDashboardInsights);

module.exports = router;