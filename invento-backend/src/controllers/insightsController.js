const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Transaction = require('../models/Transaction');
const Shop = require('../models/Shop');
const User = require('../models/User');

exports.getDashboardInsights = async (req, res) => {
  const { role, shopId, _id: userId } = req.user;
  const { month, year, scope } = req.query;

  try {
    const isAdmin = role === 'ADMIN';
    const filter = isAdmin ? {} : { shopId };

    // 1. Synchronized Date Logic
    let start, end;
    if (scope === 'MONTH' && month && year) {
      start = new Date(parseInt(year), parseInt(month) - 1, 1);
      end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // 2. Fetch Data
    const [allUsers, allShops, products, batches, transactions] = await Promise.all([
      isAdmin ? User.countDocuments() : 0,
      isAdmin ? Shop.countDocuments() : 0,
      isAdmin ? [] : Product.find(filter),
      isAdmin ? [] : Batch.find(filter),
      Transaction.find({ 
        ...filter, 
        committedAt: { $gte: start, $lte: end },
        status: 'COMMITTED' 
      }).sort({ committedAt: 1 })
    ]);

    // 3. Financial Logic (Standardized for all pages)
    const monthlyRevenue = transactions.reduce((acc, t) => acc + (t.financials?.totalRevenue || 0), 0);
    const grossProfit = transactions.reduce((acc, t) => acc + (t.financials?.netProfit || 0), 0);

    // Waste = Purchase Price * Quantity of items that expired in this month
    const expiredWaste = isAdmin ? 0 : batches
      .filter(b => b.quantity > 0 && new Date(b.expiryDate) >= start && new Date(b.expiryDate) <= end)
      .reduce((acc, b) => acc + ((b.purchasePrice || 0) * (b.quantity || 0)), 0);

    const netProfit = grossProfit - expiredWaste;

    // Total Asset Value (Sum of current inventory)
    const totalAssetValue = isAdmin ? 0 : batches
        .filter(b => b.quantity > 0)
        .reduce((acc, b) => acc + ((b.purchasePrice || 0) * (b.quantity || 0)), 0);

    // 4. Response Mapping
    res.json({
      healthScore: isAdmin ? 100 : Math.max(0, 100 - (expiredWaste > 0 ? 15 : 0) - (products.filter(p => p.totalStock <= p.minStockLevel).length * 2)),
      userCount: allUsers,
      metrics: {
        totalAssetValue, 
        monthlyRevenue, 
        monthlyNetProfit: netProfit,
        totalShops: allShops,
        totalUsers: allUsers,
        salesVolume: transactions.length,
        personalRevenue: transactions
          .filter(t => t.sellerId?.toString() === userId.toString())
          .reduce((acc, t) => acc + (t.financials?.totalRevenue || 0), 0)
      },
      chartData: transactions.map(t => ({
        date: new Date(t.committedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: t.financials.totalRevenue,
        profit: t.financials.netProfit
      })),
      insights: [{ 
        type: isAdmin ? "System" : "Audit", 
        message: isAdmin ? "All nodes linked." : `Net profit adjusted for ${expiredWaste.toLocaleString()} Rwf waste.` 
      }]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};