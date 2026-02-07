const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  // --- CONTEXT ---
  shopId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop', 
    required: true,
    index: true // Optimized for filtering by shop
  },
  soldBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Optimized for personnel reporting
  },

  // --- LINE ITEMS (High Detail) ---
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String, // Snapshot of name in case product name changes later
    sku: String,
    quantity: { type: Number, required: true },
    priceAtSale: { type: Number, required: true }, // Per unit price
    purchasePriceAtSale: { type: Number, required: true }, // The cost (COGS) per unit
    revenue: { type: Number, required: true }, // (priceAtSale * quantity)
    cost: { type: Number, required: true }, // (purchasePriceAtSale * quantity)
    
    // TRACEABILITY: Which specific batches were used?
    batchesUsed: [{
      batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
      quantityUsed: Number,
      purchasePrice: Number
    }]
  }],

  // --- SUSTAINABILITY (Packaging Intelligence) ---
  packagingWaste: {
    plasticUnits: { type: Number, default: 0 }, // e.g., number of bags
    paperUnits: { type: Number, default: 0 },
    weightKg: { type: Number, default: 0 } // Estimated weight for carbon tracking
  },

  // --- FLATTENED FINANCIALS (Optimized for Frontend) ---
  totalRevenue: { type: Number, required: true },
  totalCost: { type: Number, required: true }, // Total COGS
  totalDiscount: { type: Number, default: 0 },
  netProfit: { type: Number, required: true }, // (totalRevenue - totalCost)
  
  // --- METADATA ---
  status: { 
    type: String, 
    enum: ['FINALIZED', 'REFUNDED', 'CANCELLED'], 
    default: 'FINALIZED' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true // Optimized for the Year/Month selector
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS: Auto-calculate Margin % on the fly ---
SaleSchema.virtual('marginPercentage').get(function() {
  if (this.totalRevenue === 0) return 0;
  return ((this.netProfit / this.totalRevenue) * 100).toFixed(2);
});

// --- INDEXING: High-speed BI Analytics ---
// These ensure that your Month/Year charts load instantly even with 100,000 sales
SaleSchema.index({ shopId: 1, createdAt: -1 });
SaleSchema.index({ status: 1 });

module.exports = mongoose.model('Sale', SaleSchema);