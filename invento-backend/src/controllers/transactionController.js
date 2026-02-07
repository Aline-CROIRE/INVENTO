const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');

/**
 * 1. CREATE TRANSACTION (Standard POS Entry)
 * Synchronized with fifo batch deduction and financial sub-docs.
 */
exports.createTransaction = async (req, res) => {
  const { items, packagingWaste } = req.body; 
  const userId = req.user._id || req.user.id;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const shop = await Shop.findOne({ $or: [{ ownerId: userId }, { managerId: userId }] }).session(session);
    if (!shop) throw new Error("Shop context not found.");

    let totalRevenue = 0;
    let totalCOGS = 0;
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

      const itemRevenue = Number(item.soldPrice) * Number(item.quantity);
      totalRevenue += itemRevenue;
      totalCOGS += itemTotalCost;

      lineItems.push({
        productId: item.productId,
        name: product.name, 
        sku: product.sku,
        category: product.category,
        quantity: item.quantity,
        soldPrice: item.soldPrice,
        purchaseCost: itemTotalCost,
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
        netProfit: totalRevenue - totalCOGS,
        tax: totalRevenue * 0.15 
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
 * Syncs Profit by subtracting current month's waste.
 */
exports.getReport = async (req, res) => {
  try {
    const { month, year, scope } = req.query;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [transactions, batches] = await Promise.all([
      Transaction.find({ shopId: shop._id, status: 'COMMITTED', committedAt: { $gte: start, $lte: end } }).populate('sellerId', 'name').sort({ committedAt: -1 }),
      Batch.find({ shopId: shop._id })
    ]);

    const totalRevenue = transactions.reduce((acc, t) => acc + t.financials.totalRevenue, 0);
    const grossProfit = transactions.reduce((acc, t) => acc + t.financials.netProfit, 0);
    
    const expiredLoss = batches
      .filter(b => b.quantity > 0 && new Date(b.expiryDate) >= start && new Date(b.expiryDate) <= end)
      .reduce((acc, b) => acc + (b.purchasePrice * b.quantity), 0);

    const timelineMap = {};
    transactions.forEach(t => {
      const dateKey = new Date(t.committedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!timelineMap[dateKey]) timelineMap[dateKey] = { date: dateKey, revenue: 0, profit: 0 };
      timelineMap[dateKey].revenue += t.financials.totalRevenue;
      timelineMap[dateKey].profit += t.financials.netProfit;
    });

    res.json({
      totalRevenue,
      totalProfit: grossProfit - expiredLoss, 
      transactions,
      chartData: Object.values(timelineMap)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 3. BULK IMPORT SALES
 * Handles historical CSV data migration into the Transaction model.
 */
exports.bulkImportSales = async (req, res) => {
  const { transactions } = req.body; 
  const ownerId = req.user._id || req.user.id;

  try {
    const shop = await Shop.findOne({ ownerId });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const formattedData = transactions.map(t => ({
      shopId: shop._id,
      sellerId: ownerId,
      lineItems: [{ 
        name: t.productName || "Imported Data", 
        quantity: t.quantity || 1, 
        soldPrice: Number(t.revenue), 
        purchaseCost: Number(t.revenue) - Number(t.profit) 
      }],
      financials: {
        totalRevenue: Number(t.revenue),
        totalCOGS: Number(t.revenue) - Number(t.profit),
        netProfit: Number(t.profit),
      },
      committedAt: t.date ? new Date(t.date) : new Date()
    }));

    await Transaction.insertMany(formattedData);
    res.status(201).json({ message: "Import Successful", count: formattedData.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 4. GET DETAILED BI REPORT (Sustainability)
 */
exports.getDetailedReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [transactions, batches] = await Promise.all([
      Transaction.find({ shopId: shop._id, committedAt: { $gte: start, $lte: end }, status: 'COMMITTED' }),
      Batch.find({ shopId: shop._id })
    ]);

    const totalRevenue = transactions.reduce((acc, t) => acc + t.financials.totalRevenue, 0);
    const grossProfit = transactions.reduce((acc, t) => acc + t.financials.netProfit, 0);
    const expiredLoss = batches
      .filter(b => b.quantity > 0 && new Date(b.expiryDate) >= start && new Date(b.expiryDate) <= end)
      .reduce((acc, b) => acc + (b.purchasePrice * b.quantity), 0);

    const categoryMap = {};
    transactions.forEach(t => {
      t.lineItems.forEach(item => {
        const cat = item.category || 'General';
        if (!categoryMap[cat]) categoryMap[cat] = { name: cat, profit: 0, waste: 0 };
        categoryMap[cat].profit += (item.soldPrice * item.quantity) - item.purchaseCost;
      });
    });

    res.json({
      summary: { totalRevenue, netProfit: grossProfit - expiredLoss, expiredLoss, grossMargin: totalRevenue > 0 ? (((grossProfit - expiredLoss)/totalRevenue)*100).toFixed(1) : 0 },
      categoryData: Object.values(categoryMap),
      timeline: transactions.map(t => ({ date: new Date(t.committedAt).getDate(), revenue: t.financials.totalRevenue })),
      insights: [{ message: expiredLoss > 0 ? "Inventory waste detected. Review stock rotation." : "Resource flow is optimal." }]
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