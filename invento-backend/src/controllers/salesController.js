const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const InventoryTransaction = require('../models/InventoryTransaction');
const mongoose = require('mongoose');

exports.recordSale = async (req, res) => {
  const { items, packagingWaste } = req.body; 
  const shopId = req.user.shopId;
  const soldBy = req.user._id;

  // Use a session for atomic integrity (Ensures stock & sale are updated together or not at all)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let grandTotalRevenue = 0;
    let grandTotalCost = 0;
    let grandTotalDiscountLoss = 0;
    const processedItems = [];

    for (const item of items) {
      const { productId, quantity, discount = 0 } = item;
      
      const product = await Product.findById(productId).session(session);
      if (!product || product.totalStock < quantity) {
        throw new Error(`Insufficient stock for product: ${product?.name || productId}`);
      }

      // 1. Fetch available batches (Not expired, sorted by Expiry ASC)
      const availableBatches = await Batch.find({
        productId,
        shopId,
        quantity: { $gt: 0 },
        expiryDate: { $gt: new Date() }
      }).sort({ expiryDate: 1 }).session(session);

      let remainingToDeduct = quantity;
      let itemTotalCost = 0;
      const itemBatchesUsed = [];

      // 2. FIFO + Expiry Deduction Logic
      for (const batch of availableBatches) {
        if (remainingToDeduct <= 0) break;

        const deductQty = Math.min(batch.quantity, remainingToDeduct);
        batch.quantity -= deductQty;
        await batch.save({ session });

        itemTotalCost += (deductQty * batch.purchasePrice);
        itemBatchesUsed.push({
          batchId: batch._id,
          quantityUsed: deductQty,
          purchasePrice: batch.purchasePrice
        });

        remainingToDeduct -= deductQty;
      }

      if (remainingToDeduct > 0) throw new Error(`Stock logic error for ${product.name}`);

      // 3. Financial Calculations
      const unitPrice = availableBatches[0].sellingPrice; // Use current batch price
      const itemRevenue = (unitPrice - discount) * quantity;
      const itemDiscountLoss = discount * quantity;

      processedItems.push({
        productId,
        quantity,
        priceAtSale: unitPrice,
        discountAtSale: discount,
        revenue: itemRevenue,
        cost: itemTotalCost,
        discountLoss: itemDiscountLoss,
        batchesUsed: itemBatchesUsed
      });

      grandTotalRevenue += itemRevenue;
      grandTotalCost += itemTotalCost;
      grandTotalDiscountLoss += itemDiscountLoss;

      // 4. Update Product Total Stock
      product.totalStock -= quantity;
      await product.save({ session });

      // 5. Log Transaction
      await InventoryTransaction.create([{
        productId, shopId, type: 'SALE', quantity: -quantity,
        reason: 'Customer Sale', performedBy: soldBy
      }], { session });
    }

    // 6. Final Sale Record
    const sale = new Sale({
      shopId,
      soldBy,
      items: processedItems,
      packagingWaste: packagingWaste || { plasticUnits: 0, paperUnits: 0 },
      totalRevenue: grandTotalRevenue,
      totalCost: grandTotalCost,
      totalDiscountLoss: grandTotalDiscountLoss,
      netProfit: grandTotalRevenue - grandTotalCost
    });

    await sale.save({ session });
    await session.commitTransaction();
    
    // Populate product names for the receipt
    const populatedSale = await Sale.findById(sale._id).populate('items.productId', 'name');
    res.status(201).json(populatedSale);

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Waste Recording Logic (As requested in prompt)
exports.recordWaste = async (req, res) => {
  const { productId, batchId, quantity, reason } = req.body;
  const shopId = req.user.shopId;

  try {
    const batch = await Batch.findById(batchId);
    if (!batch || batch.quantity < quantity) throw new Error("Invalid batch or quantity");

    const lossAmount = quantity * batch.purchasePrice;

    batch.quantity -= quantity;
    await batch.save();

    await Product.findByIdAndUpdate(productId, { $inc: { totalStock: -quantity } });

    // Inventory Log
    await InventoryTransaction.create({
      productId, batchId, shopId, type: 'WASTE', 
      quantity: -quantity, reason: `Waste: ${reason}`, performedBy: req.user._id
    });

    res.status(201).json({ message: "Waste recorded", lossAmount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Financial Report for Sustainability Dashboard
exports.getProfitReport = async (req, res) => {
  const shopId = req.user.shopId;
  try {
    const sales = await Sale.find({ shopId });
    // In production, use MongoDB Aggregation for performance
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalRevenue, 0);
    const totalCost = sales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalDiscountLoss = sales.reduce((acc, s) => acc + s.totalDiscountLoss, 0);

    res.json({
      totalRevenue,
      totalCost,
      totalDiscountLoss,
      grossProfit: totalRevenue - totalCost,
      netProfit: totalRevenue - totalCost // Real Profit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};