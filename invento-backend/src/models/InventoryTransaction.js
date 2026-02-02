const mongoose = require('mongoose');

const InventoryTransactionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT', 'SALE', 'WASTE'], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);