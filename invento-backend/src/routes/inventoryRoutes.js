const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { addProductWithBatch, getInventory, adjustStock } = require('../controllers/inventoryController');

/**
 * @openapi
 * /api/inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Create product and first batch
 *     security: [{ bearerAuth: [] }]
 *   get:
 *     tags: [Inventory]
 *     summary: Get all inventory items
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', protect, authorize('OWNER', 'WORKER'), addProductWithBatch);
router.get('/', protect, getInventory);

/**
 * @openapi
 * /api/inventory/adjust:
 *   patch:
 *     tags: [Inventory]
 *     summary: Manually adjust stock levels
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/adjust', protect, authorize('OWNER'), adjustStock);

module.exports = router;