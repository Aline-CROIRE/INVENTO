const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  lineItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    sku: String,
    quantity: { type: Number, required: true },
    soldPrice: { type: Number, required: true }, 
    purchaseCost: { type: Number, required: true }, 
    vatCollected: { type: Number, default: 0 },      // NEW: VAT per item
    grossProfit: { type: Number, required: true },   // NEW: Profit per item
    packagingWaste: { type: Number, default: 0 }
  }],

  financials: {
    totalRevenue: { type: Number, required: true }, // Excludes VAT
    totalCOGS: { type: Number, required: true }, 
    totalVatCollected: { type: Number, default: 0 },// NEW: Separated VAT
    grossProfit: { type: Number, required: true },  // NEW: Revenue - COGS
  },

  status: { type: String, enum: ['COMMITTED', 'CANCELLED'], default: 'COMMITTED' },
  committedAt: { type: Date, default: Date.now }
}, { timestamps: true });

TransactionSchema.index({ shopId: 1, committedAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);