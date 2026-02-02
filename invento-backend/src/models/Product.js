const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  name: { type: String, required: true },
  sku: { type: String, unique: true },
  category: { type: String },
  unit: { type: String, default: 'pcs' }, // pcs, kg, ltr
  minStockLevel: { type: Number, default: 5 },
  totalStock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);