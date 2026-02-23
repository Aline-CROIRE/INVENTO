const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Shop = require('../models/Shop');
const Expense = require('../models/Expense'); // Integrated Expense Model
const mongoose = require('mongoose');

const VAT_RATE = 0.15; // 15% Exclusive VAT (Added on top of soldPrice)

/**
 * 1. CREATE TRANSACTION (Standard POS Entry)
 * Synchronized with FIFO batch deduction and advanced financial sub-docs.
 */
exports.createTransaction = async (req, res) => {
  const { items, packagingWaste } = req.body; 
  const userId = req.user._id || req.user.id;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const shop = await Shop.findOne({ $or: [{ ownerId: userId }, { managerId: userId }] }).session(session);
    if (!shop) throw new Error("Shop context not found.");

    let totalRevenue = 0; // Excludes VAT
    let totalCOGS = 0;
    let totalVatCollected = 0;
    let totalGrossProfit = 0;
    const lineItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product || product.totalStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product?.name || 'Item'}`);
      }

      // FIFO Logic to deduct from oldest batches first
      const batches = await Batch.find({ 
        productId: item.productId, 
        shopId: shop._id,
        quantity: { $gt: 0 } 
      }).sort({ expiryDate: 1 }).session(session);

      let remainingToDeduct = item.quantity;
      let itemTotalCost = 0;

      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;
        const deduction = Math.min(batch.quantity, remainingToDeduct);
        batch.quantity -= deduction;
        await batch.save({ session });
        itemTotalCost += (deduction * batch.purchasePrice);
        remainingToDeduct -= deduction;
      }

      // Financial Math (Line Item Level)
      const itemRevenue = Number(item.soldPrice) * Number(item.quantity);
      const itemVAT = itemRevenue * VAT_RATE; // Exclusive VAT calculation
      const itemGrossProfit = itemRevenue - itemTotalCost;

      totalRevenue += itemRevenue;
      totalCOGS += itemTotalCost;
      totalVatCollected += itemVAT;
      totalGrossProfit += itemGrossProfit;

      lineItems.push({
        productId: item.productId,
        name: product.name, 
        sku: product.sku,
        category: product.category,
        quantity: item.quantity,
        soldPrice: item.soldPrice,
        purchaseCost: itemTotalCost,
        vatCollected: itemVAT,
        grossProfit: itemGrossProfit,
        packagingWaste: packagingWaste || 0
      });

      product.totalStock -= item.quantity;
      await product.save({ session });
    }

    const transaction = await Transaction.create([{
      shopId: shop._id,
      sellerId: userId,
      lineItems,
      financials: {
        totalRevenue,
        totalCOGS,
        totalVatCollected,
        grossProfit: totalGrossProfit // Replaced netProfit with grossProfit at the transaction level
      },
      committedAt: new Date()
    }], { session });

    await session.commitTransaction();
    const populated = await Transaction.findById(transaction[0]._id).populate('sellerId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * 2. GET SALES REPORT (Standard Ledger)
 * Calculates True Net Profit by subtracting Expired Loss and Operating Expenses.
 */
exports.getReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [transactions, batches, expenses] = await Promise.all([
      Transaction.find({ shopId: shop._id, status: 'COMMITTED', committedAt: { $gte: start, $lte: end } }).populate('sellerId', 'name').sort({ committedAt: -1 }),
      Batch.find({ shopId: shop._id }),
      Expense.find({ shopId: shop._id, date: { $gte: start, $lte: end }, status: { $in: ['PAID', 'APPROVED'] } })
    ]);

    const totalRevenue = transactions.reduce((acc, t) => acc + t.financials.totalRevenue, 0);
    const totalGrossProfit = transactions.reduce((acc, t) => acc + t.financials.grossProfit, 0);
    
    const expiredLoss = batches
      .filter(b => b.quantity > 0 && new Date(b.expiryDate) >= start && new Date(b.expiryDate) <= end)
      .reduce((acc, b) => acc + (b.purchasePrice * b.quantity), 0);

    const totalOperatingExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // TRUE NET PROFIT FORMULA
    const trueNetProfit = totalGrossProfit - expiredLoss - totalOperatingExpenses;

    const timelineMap = {};
    transactions.forEach(t => {
      const dateKey = new Date(t.committedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!timelineMap[dateKey]) timelineMap[dateKey] = { date: dateKey, revenue: 0, profit: 0 };
      timelineMap[dateKey].revenue += t.financials.totalRevenue;
      timelineMap[dateKey].profit += t.financials.grossProfit; // Map displays Gross Profit over time
    });

    res.json({
      totalRevenue,
      totalGrossProfit,
      totalOperatingExpenses,
      expiredLoss,
      totalProfit: trueNetProfit, // Re-mapped to standard API response name for frontend compatibility
      transactions,
      expenses,
      chartData: Object.values(timelineMap)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 3. BULK IMPORT SALES
 * Handles historical CSV data migration into the updated Transaction model.
 */
exports.bulkImportSales = async (req, res) => {
  const { transactions } = req.body; 
  const ownerId = req.user._id || req.user.id;

  try {
    const shop = await Shop.findOne({ ownerId });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const formattedData = transactions.map(t => {
      const revenue = Number(t.revenue);
      const profit = Number(t.profit); // Historically this was Gross Profit
      const cogs = revenue - profit;
      const vat = revenue * VAT_RATE;

      return {
        shopId: shop._id,
        sellerId: ownerId,
        lineItems: [{ 
          name: t.productName || "Imported Data", 
          quantity: t.quantity || 1, 
          soldPrice: revenue, 
          purchaseCost: cogs,
          vatCollected: vat,
          grossProfit: profit
        }],
        financials: {
          totalRevenue: revenue,
          totalCOGS: cogs,
          totalVatCollected: vat,
          grossProfit: profit,
        },
        committedAt: t.date ? new Date(t.date) : new Date()
      };
    });

    await Transaction.insertMany(formattedData);
    res.status(201).json({ message: "Import Successful", count: formattedData.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 4. GET DETAILED BI REPORT (Financials & Expenses)
 */
exports.getDetailedReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [transactions, batches, expenses] = await Promise.all([
      Transaction.find({ shopId: shop._id, committedAt: { $gte: start, $lte: end }, status: 'COMMITTED' }),
      Batch.find({ shopId: shop._id }),
      Expense.find({ shopId: shop._id, date: { $gte: start, $lte: end }, status: { $in: ['PAID', 'APPROVED'] } })
    ]);

    const totalRevenue = transactions.reduce((acc, t) => acc + t.financials.totalRevenue, 0);
    const totalGrossProfit = transactions.reduce((acc, t) => acc + t.financials.grossProfit, 0);
    const totalVatCollected = transactions.reduce((acc, t) => acc + (t.financials.totalVatCollected || 0), 0);
    
    const expiredLoss = batches
      .filter(b => b.quantity > 0 && new Date(b.expiryDate) >= start && new Date(b.expiryDate) <= end)
      .reduce((acc, b) => acc + (b.purchasePrice * b.quantity), 0);

    const totalOperatingExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const trueNetProfit = totalGrossProfit - expiredLoss - totalOperatingExpenses;

    const categoryMap = {};
    transactions.forEach(t => {
      t.lineItems.forEach(item => {
        const cat = item.category || 'General';
        if (!categoryMap[cat]) categoryMap[cat] = { name: cat, profit: 0, revenue: 0 };
        categoryMap[cat].revenue += (item.soldPrice * item.quantity);
        categoryMap[cat].profit += item.grossProfit;
      });
    });

    const expenseBreakdown = {};
    expenses.forEach(e => {
      if (!expenseBreakdown[e.category]) expenseBreakdown[e.category] = { name: e.category, amount: 0 };
      expenseBreakdown[e.category].amount += e.amount;
    });

    let primaryInsight = "Resource flow is optimal.";
    if (expiredLoss > 0) primaryInsight = "Inventory waste detected. Review stock rotation.";
    if (totalOperatingExpenses > totalGrossProfit) primaryInsight = "Warning: Operating expenses currently exceed Gross Profit.";

    res.json({
      summary: { 
        totalRevenue, 
        totalVatCollected,
        totalOperatingExpenses,
        expiredLoss,
        grossProfit: totalGrossProfit,
        netProfit: trueNetProfit, 
        grossMargin: totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : 0,
        netMargin: totalRevenue > 0 ? ((trueNetProfit / totalRevenue) * 100).toFixed(1) : 0
      },
      categoryData: Object.values(categoryMap),
      expenseBreakdown: Object.values(expenseBreakdown),
      timeline: transactions.map(t => ({ date: new Date(t.committedAt).getDate(), revenue: t.financials.totalRevenue })),
      insights: [{ message: primaryInsight }]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 5. PURGE TRANSACTIONS
 */
exports.purgeTransactions = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    await Transaction.deleteMany({ shopId: shop._id });
    res.json({ message: "Ledger cleared." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 6. DELETE INDIVIDUAL SALE
 */
exports.deleteSale = async (req, res) => {
    try {
      await Transaction.findByIdAndDelete(req.params.id);
      res.json({ message: "Sale deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};