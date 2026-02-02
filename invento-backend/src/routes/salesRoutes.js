const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { recordSale, recordWaste, getProfitReport } = require('../controllers/salesController');

/**
 * @openapi
 * /api/sales:
 *   post:
 *     tags: [Sales]
 *     summary: Record a sale (auto-deducts from oldest/expiring batches)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', protect, recordSale);

/**
 * @openapi
 * /api/sales/waste:
 *   post:
 *     tags: [Sales]
 *     summary: Record waste/damage/expiry
 *     security: [{ bearerAuth: [] }]
 */
router.post('/waste', protect, recordWaste);

/**
 * @openapi
 * /api/sales/report:
 *   get:
 *     tags: [Sales]
 *     summary: Get shop profit report
 *     security: [{ bearerAuth: [] }]
 */
router.get('/report', protect, getProfitReport);

module.exports = router;