const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  batchNumber: { type: String, required: true },
  purchasePrice: { type: Number, required: true }, // Cost price
  sellingPrice: { type: Number, required: true }, // Current default selling price
  quantity: { type: Number, required: true },
  initialQuantity: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  isExpired: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Batch', BatchSchema);
