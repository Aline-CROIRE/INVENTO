const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // High-detail line items for historical auditing
  lineItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    sku: String,
    quantity: { type: Number, required: true },
    soldPrice: { type: Number, required: true }, // Price at moment of sale
    purchaseCost: { type: Number, required: true }, // Total COGS for this item based on batches
    packagingWaste: { type: Number, default: 0 }
  }],

  // Financial snapshot (Calculated at commit time)
  financials: {
    totalRevenue: { type: Number, required: true },
    totalCOGS: { type: Number, required: true }, // Cost of Goods Sold
    netProfit: { type: Number, required: true },
    tax: { type: Number, default: 0 }
  },

  status: { type: String, enum: ['COMMITTED', 'CANCELLED'], default: 'COMMITTED' },
  committedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexing for high-performance analytics
TransactionSchema.index({ shopId: 1, committedAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);