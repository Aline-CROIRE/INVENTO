const mongoose = require('mongoose');

const WasteEventSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  quantity: { type: Number, required: true },
  reason: { type: String, enum: ['EXPIRED', 'DAMAGED', 'LOST'], required: true },
  lossAmount: { type: Number, required: true }, // quantity * purchasePrice
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('WasteEvent', WasteEventSchema);