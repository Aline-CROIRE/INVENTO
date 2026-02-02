const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    priceAtSale: { type: Number, required: true }, // Per unit
    discountAtSale: { type: Number, default: 0 },   // Per unit
    revenue: { type: Number, required: true },     // (Price - Discount) * Qty
    cost: { type: Number, required: true },        // Sum of Batch Purchase Prices
    discountLoss: { type: Number, required: true }, // Total discount for this item
    batchesUsed: [{
      batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
      quantityUsed: { type: Number },
      purchasePrice: { type: Number }
    }]
  }],
  packagingWaste: {
    plasticUnits: { type: Number, default: 0 },
    paperUnits: { type: Number, default: 0 }
  },
  totalRevenue: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  totalDiscountLoss: { type: Number, required: true },
  netProfit: { type: Number, required: true }, // TotalRevenue - TotalCost
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', SaleSchema);