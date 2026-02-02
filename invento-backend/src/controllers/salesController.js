const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const WasteEvent = require('../models/WasteEvent');
const InventoryTransaction = require('../models/InventoryTransaction');

exports.recordSale = async (req, res) => {
  const { items } = req.body; // Array of { productId, quantity }
  const shopId = req.user.shopId;

  try {
    let totalRevenue = 0;
    let totalCost = 0;
    const saleItems = [];

    for (const item of items) {
      let remainingToSell = item.quantity;
      
      // Find batches for this product, sorted by Expiry (First to expire first)
      const batches = await Batch.find({ 
        productId: item.productId, 
        quantity: { $gt: 0 } 
      }).sort({ expiryDate: 1 });

      for (const batch of batches) {
        if (remainingToSell <= 0) break;

        const sellFromBatch = Math.min(batch.quantity, remainingToSell);
        
        // Update Batch
        batch.quantity -= sellFromBatch;
        await batch.save();

        // Update Product total
        await Product.findByIdAndUpdate(item.productId, { $inc: { totalStock: -sellFromBatch } });

        // Calculate financials
        const itemRevenue = sellFromBatch * batch.sellingPrice;
        const itemCost = sellFromBatch * batch.purchasePrice;
        
        totalRevenue += itemRevenue;
        totalCost += itemCost;

        saleItems.push({
          productId: item.productId,
          batchId: batch._id,
          quantity: sellFromBatch,
          priceAtSale: batch.sellingPrice,
          costAtSale: batch.purchasePrice
        });

        remainingToSell -= sellFromBatch;

        await InventoryTransaction.create({
          productId: item.productId, batchId: batch._id, shopId,
          type: 'SALE', quantity: -sellFromBatch, reason: 'Sale', performedBy: req.user._id
        });
      }

      if (remainingToSell > 0) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    const sale = await Sale.create({
      shopId,
      items: saleItems,
      totalAmount: totalRevenue,
      totalCost: totalCost,
      netProfit: totalRevenue - totalCost,
      soldBy: req.user._id
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.recordWaste = async (req, res) => {
  const { productId, batchId, quantity, reason } = req.body;
  const shopId = req.user.shopId;

  try {
    const batch = await Batch.findById(batchId);
    if (batch.quantity < quantity) throw new Error('Not enough stock in batch');

    const lossAmount = quantity * batch.purchasePrice;

    batch.quantity -= quantity;
    await batch.save();

    await Product.findByIdAndUpdate(productId, { $inc: { totalStock: -quantity } });

    const waste = await WasteEvent.create({
      shopId, productId, batchId, quantity, reason,
      lossAmount, recordedBy: req.user._id
    });

    await InventoryTransaction.create({
      productId, batchId, shopId,
      type: 'WASTE', quantity: -quantity, reason: `Waste: ${reason}`, performedBy: req.user._id
    });

    res.status(201).json(waste);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProfitReport = async (req, res) => {
  const shopId = req.user.shopId;
  try {
    const sales = await Sale.find({ shopId });
    const waste = await WasteEvent.find({ shopId });

    const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalCOGS = sales.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalWasteLoss = waste.reduce((acc, curr) => acc + curr.lossAmount, 0);

    res.json({
      totalRevenue,
      grossProfit: totalRevenue - totalCOGS,
      netProfit: totalRevenue - totalCOGS - totalWasteLoss,
      totalWasteLoss,
      salesCount: sales.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};