const Expense = require('../models/Expense');
const Shop = require('../models/Shop');

/**
 * 1. CREATE EXPENSE
 * Adds a new expense (e.g., Rent, Salary) to the shop's ledger.
 */
exports.createExpense = async (req, res) => {
  try {
    const { title, amount, category, date, paymentMethod, receiptUrl, status } = req.body;
    const userId = req.user._id || req.user.id;

    const shop = await Shop.findOne({ $or: [{ ownerId: userId }, { managerId: userId }] });
    if (!shop) return res.status(404).json({ message: "Shop context not found." });

    const expense = await Expense.create({
      shopId: shop._id,
      title,
      amount: Number(amount),
      category,
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      receiptUrl, // Optional image/PDF link from your frontend
      status: status || 'PAID'
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * 2. GET ALL EXPENSES (With Pagination & Filters)
 * Useful for the Expenses Dashboard/List view.
 */
exports.getExpenses = async (req, res) => {
  try {
    const { month, year, category, status } = req.query;
    const userId = req.user._id || req.user.id;

    const shop = await Shop.findOne({ $or: [{ ownerId: userId }, { managerId: userId }] });
    if (!shop) return res.status(404).json({ message: "Shop context not found." });

    let filter = { shopId: shop._id };

    // Filter by Month/Year if provided
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    // Filter by Category or Status if provided
    if (category) filter.category = category;
    if (status) filter.status = status;

    const expenses = await Expense.find(filter).sort({ date: -1 });

    // Calculate quick totals for the requested list
    const totalAmount = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    res.status(200).json({
      count: expenses.length,
      totalAmount,
      expenses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 3. UPDATE EXPENSE
 * Useful for changing status from PENDING to PAID, or attaching a receipt later.
 */
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const expense = await Expense.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * 4. DELETE EXPENSE
 * Removes an expense from the ledger.
 */
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Expense deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};