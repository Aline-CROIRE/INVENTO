const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    quantity: { type: Number, required: true },
    priceAtSale: { type: Number, required: true },
    costAtSale: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true }, // Revenue
  totalCost: { type: Number, required: true },   // COGS
  netProfit: { type: Number, required: true },   // Revenue - COGS
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', SaleSchema);