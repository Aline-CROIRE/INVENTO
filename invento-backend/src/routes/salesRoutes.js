const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { recordSale, recordWaste, getProfitReport } = require('../controllers/salesController');

router.post('/', protect, authorize('OWNER', 'WORKER'), recordSale);
router.post('/waste', protect, authorize('OWNER', 'WORKER'), recordWaste);
router.get('/report', protect, authorize('OWNER'), getProfitReport);

// ... existing imports
router.delete('/:id', protect, transactionController.deleteSale);
router.delete('/all', protect, authorize('OWNER'), transactionController.purgeTransactions); // Bulk purge

module.exports = router;