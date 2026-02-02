const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const WasteEvent = require('../models/WasteEvent');

exports.getDashboardInsights = async (req, res) => {
  const shopId = req.user.shopId;
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  try {
    // 1. Calculate Inventory Health Score
    const products = await Product.find({ shopId });
    const lowStockProducts = products.filter(p => p.totalStock <= p.minStockLevel);
    
    // Formula: (Healthy Products / Total Products) * 100
    const healthScore = products.length > 0 
      ? Math.round(((products.length - lowStockProducts.length) / products.length) * 100) 
      : 100;

    // 2. Identify Actionable Insights
    const insights = [];

    // Check for expiring stock
    const expiringBatches = await Batch.find({
      shopId,
      expiryDate: { $lte: nextWeek, $gte: today },
      quantity: { $gt: 0 }
    }).populate('productId');

    expiringBatches.forEach(batch => {
      insights.push({
        type: 'EXPIRY_RISK',
        severity: 'HIGH',
        message: `${batch.productId.name} (Batch ${batch.batchNumber}) expires soon.`,
        action: `Apply 30% discount to clear ${batch.quantity} units.`
      });
    });

    // Check for low stock
    lowStockProducts.forEach(prod => {
      insights.push({
        type: 'LOW_STOCK',
        severity: 'MEDIUM',
        message: `${prod.name} is below minimum stock level.`,
        action: `Reorder at least ${prod.minStockLevel * 2} units.`
      });
    });

    // 3. Before vs After Metrics (Current Month vs Previous)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const currentSales = await Sale.find({ shopId, createdAt: { $gte: startOfMonth } });
    const prevSales = await Sale.find({ shopId, createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth } });

    const currentProfit = currentSales.reduce((acc, s) => acc + s.netProfit, 0);
    const prevProfit = prevSales.reduce((acc, s) => acc + s.netProfit, 0);
    const profitGrowth = prevProfit === 0 ? 0 : ((currentProfit - prevProfit) / prevProfit) * 100;

    // 4. Sustainability Metrics (MVP)
    const wasteEvents = await WasteEvent.find({ shopId, createdAt: { $gte: startOfMonth } });
    const totalWasteKg = wasteEvents.reduce((acc, w) => acc + w.quantity, 0); // Assuming qty in kg for MVP
    const co2SavedPotential = totalWasteKg * 2.5; // Average 2.5kg CO2 per 1kg food waste

    res.json({
      healthScore,
      insights: insights.slice(0, 2), // Max 2 actionable insights
      metrics: {
        currentMonthProfit: currentProfit,
        profitGrowth: profitGrowth.toFixed(1),
        co2ImpactKg: co2SavedPotential.toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};