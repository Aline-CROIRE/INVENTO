const Product = require('../models/Product');
const Batch = require('../models/Batch');
const InventoryTransaction = require('../models/InventoryTransaction');

exports.addProductWithBatch = async (req, res) => {
  const { name, sku, category, unit, minStockLevel, batchNumber, purchasePrice, sellingPrice, quantity, expiryDate } = req.body;
  const shopId = req.user.shopId;

  try {
    // 1. Create Product
    const product = await Product.create({
      shopId, name, sku, category, unit, minStockLevel, totalStock: quantity
    });

    // 2. Create Initial Batch
    const batch = await Batch.create({
      productId: product._id,
      shopId,
      batchNumber,
      purchasePrice,
      sellingPrice,
      quantity,
      initialQuantity: quantity,
      expiryDate
    });

    // 3. Log Transaction
    await InventoryTransaction.create({
      productId: product._id,
      batchId: batch._id,
      shopId,
      type: 'IN',
      quantity,
      reason: 'Initial Stock',
      performedBy: req.user._id
    });

    res.status(201).json({ product, batch });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.user.shopId });
    const batches = await Batch.find({ shopId: req.user.shopId, quantity: { $gt: 0 } }).sort({ expiryDate: 1 });
    res.json({ products, batches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adjustStock = async (req, res) => {
  const { productId, batchId, adjustmentQty, reason } = req.body;
  try {
    const batch = await Batch.findById(batchId);
    batch.quantity += adjustmentQty;
    await batch.save();

    const product = await Product.findById(productId);
    product.totalStock += adjustmentQty;
    await product.save();

    await InventoryTransaction.create({
      productId, batchId, shopId: req.user.shopId,
      type: 'ADJUSTMENT', quantity: adjustmentQty, reason, performedBy: req.user._id
    });

    res.json({ message: 'Stock adjusted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};