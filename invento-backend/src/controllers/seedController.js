const mongoose = require('mongoose');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const Shop = require('../models/Shop');
const InventoryTransaction = require('../models/InventoryTransaction');

const randomDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    return d;
};

exports.seedDatabase = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Not authorized" });

        const ownerId = req.user._id || req.user.id;
        const shop = await Shop.findOne({ ownerId });
        if (!shop) return res.status(404).json({ message: "Shop not found" });

        const shopId = shop._id;
        console.log(`🚀 Starting Fast Seed for Shop: ${shop.name}`);

        // 1. CREATE PRODUCTS
        const productDefs = [
            { name: "Inyange Milk 500ml", category: "Dairy", unit: "pcs", minStockLevel: 20 },
            { name: "Basmati Rice 1kg", category: "Grains", unit: "pcs", minStockLevel: 10 },
            { name: "USB-C Fast Cable", category: "Electronics", unit: "pcs", minStockLevel: 5 },
            { name: "Movit Soap", category: "Hygiene", unit: "pcs", minStockLevel: 15 }
        ];

        const products = [];
        for (const p of productDefs) {
            const product = await Product.create({
                ...p, shopId, 
                sku: p.name.substring(0, 3).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000),
                totalStock: 160 // Starting amount
            });
            products.push(product);
        }

        // 2. CREATE BATCHES
        const batches = [];
        for (const prod of products) {
            const sPrice = prod.category === 'Electronics' ? 5000 : 1200;
            const pPrice = sPrice * 0.65;

            const batch = await Batch.create({
                productId: prod._id, shopId,
                batchNumber: "BATCH-" + Math.floor(Math.random() * 10000),
                quantity: 160, initialQuantity: 160,
                purchasePrice: pPrice, sellingPrice: sPrice,
                expiryDate: new Date(Date.now() + 86400000 * 180),
                status: "ACTIVE"
            });
            batches.push(batch);
        }

        // 3. PREPARE BULK DATA
        const salesToInsert = [];
        const transactionsToInsert = [];
        const stockUpdates = [];

        console.log("📦 Preparing 60 Sales...");

        for (let i = 0; i < 60; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const saleDate = randomDate(daysAgo);
            const prod = products[Math.floor(Math.random() * products.length)];
            const batch = batches.find(b => b.productId.equals(prod._id));
            
            const qty = Math.floor(Math.random() * 3) + 1;
            const revenue = batch.sellingPrice * qty;
            const cost = batch.purchasePrice * qty;

            salesToInsert.push({
                shopId, soldBy: ownerId,
                items: [{
                    productId: prod._id, quantity: qty, priceAtSale: batch.sellingPrice,
                    discountAtSale: 0, revenue, cost, discountLoss: 0,
                    batchesUsed: [{ batchId: batch._id, quantityUsed: qty, purchasePrice: batch.purchasePrice }]
                }],
                totalRevenue: revenue, totalCost: cost, totalDiscountLoss: 0,
                netProfit: revenue - cost, createdAt: saleDate
            });

            transactionsToInsert.push({
                productId: prod._id, shopId, batchId: batch._id,
                type: 'SALE', quantity: -qty, reason: 'Demo Sale',
                performedBy: ownerId, createdAt: saleDate
            });

            // Tracking stock changes locally first to avoid 60 DB calls
            stockUpdates.push({ prodId: prod._id, batchId: batch._id, qty });
        }

        // 4. EXECUTE BULK SAVES (Much faster)
        console.log("💾 Writing to Database...");
        
        await Sale.insertMany(salesToInsert);
        await InventoryTransaction.insertMany(transactionsToInsert);

        // Update Product and Batch stocks in parallel
        await Promise.all(products.map(async (p) => {
            const totalSold = stockUpdates.filter(s => s.prodId.equals(p._id)).reduce((sum, s) => sum + s.qty, 0);
            await Product.findByIdAndUpdate(p._id, { $inc: { totalStock: -totalSold } });
            const batch = batches.find(b => b.productId.equals(p._id));
            await Batch.findByIdAndUpdate(batch._id, { $inc: { quantity: -totalSold } });
        }));

        console.log("✅ SEEDING COMPLETE");
        res.status(200).json({ message: "60 Sales generated successfully!" });

    } catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({ message: "Seed Failed", error: error.message });
    }
};