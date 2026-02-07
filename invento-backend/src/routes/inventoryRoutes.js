const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');

// --- SAFETY CHECK FOR MIDDLEWARE ---
// This handles cases where auth.js exports an object OR a single function
const protect = authMiddleware.protect || authMiddleware;
const authorize = authMiddleware.authorize || (() => (req, res, next) => next()); 

// --- DESTRUCTURE CONTROLLERS ---
const { 
  addProductWithBatch, 
  getInventory, 
  adjustStock, 
  updateProduct, 
  deleteProduct, 
  getDetailedReport 
} = inventoryController;

// --- VERIFY FUNCTIONS EXIST (Prevents the crash) ---
if (!getInventory) console.error("🛑 ERROR: getInventory is undefined in inventoryController");
if (!getDetailedReport) console.error("🛑 ERROR: getDetailedReport is undefined in inventoryController");

/**
 * @openapi
 * /api/inventory/report/detailed:
 *   get:
 *     tags: [Inventory]
 *     summary: Get BI Sustainability Report
 */
router.get('/report/detailed', protect, getDetailedReport);

/**
 * @openapi
 * /api/inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: Get all products and metrics
 */
router.get('/', protect, getInventory);

/**
 * @openapi
 * /api/inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Add product and first batch
 */
router.post('/', protect, authorize('OWNER', 'WORKER'), addProductWithBatch);

/**
 * @openapi
 * /api/inventory/adjust:
 *   patch:
 *     tags: [Inventory]
 *     summary: Manually adjust stock
 */
router.patch('/adjust', protect, authorize('OWNER'), adjustStock);

/**
 * @openapi
 * /api/inventory/:id:
 *   put:
 *     tags: [Inventory]
 *     summary: Update metadata
 *   delete:
 *     tags: [Inventory]
 *     summary: Delete product and batches
 */
router.put('/:id', protect, authorize('OWNER'), updateProduct);
router.delete('/:id', protect, authorize('OWNER'), deleteProduct);

module.exports = router;