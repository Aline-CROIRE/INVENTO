const express = require('express');
const router = express.Router();
const { 
  createExpense, 
  getExpenses, 
  updateExpense, 
  deleteExpense 
} = require('../controllers/expenseController');


const { protect } = require('../middleware/auth'); 

// Apply authentication middleware to all expense routes
router.use(protect);

// --------------------------------------------------------
// EXPENSE ROUTES
// Base URL: /api/expenses
// --------------------------------------------------------

router.route('/')
  .post(createExpense) // Create a new expense
  .get(getExpenses);   // Get all expenses (supports ?month=x&year=y filters)

router.route('/:id')
  .put(updateExpense)    // Update an existing expense (e.g., attach receipt)
  .delete(deleteExpense); // Delete an expense

module.exports = router;