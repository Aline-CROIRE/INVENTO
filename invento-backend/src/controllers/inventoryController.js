const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const InventoryTransaction = require('../models/InventoryTransaction');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');

/**
 * 1. GET INVENTORY
 * Fetches products, active batches, and real-time stock intelligence metrics.
 */
exports.getInventory = async (req, res) => {
  try {
    // 1. Get Shop Context
    const shop = await Shop.findOne({ ownerId: req.user._id || req.user.id });
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    const shopId = shop._id;

    // 2. Fetch Data
    const products = await Product.find({ shopId }).sort({ createdAt: -1 }).lean();
    const batches = await Batch.find({ shopId, quantity: { $gt: 0 } }).sort({ expiryDate: 1 }).lean();

    // 3. Intelligence Metrics Calculation
    const totalAssetValue = batches.reduce((acc, b) => acc + (b.purchasePrice * b.quantity), 0);
    const potentialRevenue = batches.reduce((acc, b) => acc + (b.sellingPrice * b.quantity), 0);
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringSoonCount = batches.filter(b => {
        const expiry = new Date(b.expiryDate);
        return expiry <= thirtyDaysFromNow && expiry >= today;
    }).length;

    // 4. Map current selling price from the most recent batch to the product
    const productsWithPrice = products.map(p => {
      const activeBatch = batches.find(b => b.productId.toString() === p._id.toString());
      return {
        ...p,
        sellingPrice: activeBatch ? activeBatch.sellingPrice : 0
      };
    });

    res.json({ 
      products: productsWithPrice, 
      batches, 
      metrics: {
        totalAssetValue,
        potentialRevenue,
        expiringSoonCount,
        lowStockCount: productsWithPrice.filter(p => p.totalStock <= p.minStockLevel).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 2. ADD PRODUCT WITH BATCH (Purchase Stock-In)
 */
exports.addProductWithBatch = async (req, res) => {
  const { name, sku, category, unit, minStockLevel, batchNumber, purchasePrice, sellingPrice, quantity, expiryDate } = req.body;
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const shop = await Shop.findOne({ ownerId: req.user.id });
    const shopId = shop._id;

    let product = await Product.findOne({ sku, shopId }).session(session);

    if (!product) {
      product = new Product({
        shopId, name, sku, category, unit, minStockLevel, totalStock: quantity
      });
    } else {
      product.totalStock += Number(quantity);
    }
    await product.save({ session });

    const batch = await Batch.create([{
      productId: product._id,
      shopId,
      batchNumber,
      purchasePrice,
      sellingPrice,
      quantity,
      initialQuantity: quantity,
      expiryDate,
      status: 'ACTIVE'
    }], { session });

    await InventoryTransaction.create([{
      productId: product._id,
      batchId: batch[0]._id,
      shopId,
      type: 'IN',
      quantity,
      reason: 'Purchase Stock-In',
      performedBy: req.user.id
    }], { session });

    await session.commitTransaction();
    res.status(201).json({ product, batch: batch[0] });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * 3. GET DETAILED BI REPORT (For Sustainability Page)
 */
exports.getDetailedReport = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user.id });
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    const shopId = shop._id;

    const { scope } = req.query; 
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter sales based on scope (Monthly vs All-Time)
    const dateFilter = scope === 'full_history' ? { shopId } : { shopId, createdAt: { $gte: thirtyDaysAgo } };

    const [sales, allBatches] = await Promise.all([
      Sale.find(dateFilter).lean(),
      Batch.find({ shopId }).lean()
    ]);

    // Financial Summaries
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalRevenue, 0);
    const totalCOGS = sales.reduce((acc, s) => acc + s.totalCost, 0);
    const netProfit = sales.reduce((acc, s) => acc + s.netProfit, 0);
    
    // Waste Calculation: Anything expired that still has quantity
    const expiredLoss = allBatches
        .filter(b => b.quantity > 0 && new Date(b.expiryDate) < new Date())
        .reduce((acc, b) => acc + (b.purchasePrice * b.quantity), 0);

    const grossMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Category Intelligence
    const catMap = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const cat = item.productId?.category || 'General';
        if (!catMap[cat]) catMap[cat] = { name: cat, profit: 0 };
        catMap[cat].profit += item.revenue - item.cost;
      });
    });

    // Timeline Intelligence
    const timelineMap = {};
    sales.forEach(s => {
      const date = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!timelineMap[date]) timelineMap[date] = { date, revenue: 0, profit: 0 };
      timelineMap[date].revenue += s.totalRevenue;
      timelineMap[date].profit += s.netProfit; 
    });

    res.json({
      summary: { totalRevenue, totalCOGS, netProfit, expiredLoss, grossMargin },
      categoryData: Object.values(catMap).sort((a,b) => b.profit - a.profit).slice(0, 5),
      timeline: Object.values(timelineMap).sort((a, b) => new Date(a.date) - new Date(b.date)),
      comparison: {
          revenueGrowth: 12.5, // Mocked for UI, could be calculated by comparing periods
          profitGrowth: 8.2
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 4. ATOMIC DELETE
 */
exports.deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Product.findByIdAndDelete(req.params.id).session(session);
    await Batch.deleteMany({ productId: req.params.id }).session(session);
    await InventoryTransaction.deleteMany({ productId: req.params.id }).session(session);
    
    await session.commitTransaction();
    res.json({ message: "Product and historical data purged." });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// ... adjustStock and updateProduct remain standard ...
exports.updateProduct = async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(product);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.adjustStock = async (req, res) => {
    const { productId, batchId, adjustmentQty, reason } = req.body;
    try {
      const batch = await Batch.findById(batchId);
      batch.quantity += Number(adjustmentQty);
      await batch.save();
  
      const product = await Product.findById(productId);
      product.totalStock += Number(adjustmentQty);
      await product.save();
  
      res.json({ message: 'Stock Adjusted Successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
};
exports.bulkImport = async (req, res) => {
  const { products } = req.body;
  const shopId = req.user.shopId;

  try {
    // Basic bulk logic
    const formatted = products.map(p => ({
      ...p,
      shopId,
      totalStock: Number(p.quantity)
    }));
    
    await Product.insertMany(formatted);
    res.status(201).json({ message: "Import Successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};