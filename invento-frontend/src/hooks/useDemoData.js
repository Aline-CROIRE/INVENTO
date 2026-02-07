import { useState, useEffect } from 'react';
import { ShoppingCart, Package, DollarSign, TrendingUp, Users, Store } from 'lucide-react';

const generateDemoData = () => {
  const currentMonth = "May '25";
  
  // Sales & Inventory Data
  const demoProducts = [
    { _id: 'p001', name: 'Coffee Beans 1kg', sku: 'COF-001', category: 'Drinks', totalStock: 45, unit: 'kg', minStockLevel: 5, sellingPrice: 12500 },
    { _id: 'p002', name: 'Laptop Air 13', sku: 'ELEC-L13', category: 'Electronics', totalStock: 3, unit: 'pcs', minStockLevel: 5, sellingPrice: 650000 },
    { _id: 'p003', name: 'Organic Milk 1L', sku: 'MILK-001', category: 'Dairy', totalStock: 15, unit: 'ltr', minStockLevel: 20, sellingPrice: 1200 },
    { _id: 'p004', name: 'Fresh Apple Pack', sku: 'FRT-001', category: 'Produce', totalStock: 8, unit: 'pk', minStockLevel: 10, sellingPrice: 3800 },
  ];

  const demoTransactions = [
    { _id: 't001', committedAt: '2025-05-20T10:00:00Z', lineItems: [{ name: 'Coffee Beans', quantity: 2 }], financials: { totalRevenue: 25000, netProfit: 9000 }, sellerId: { email: 'owner@shop.com' } },
    { _id: 't002', committedAt: '2025-05-19T14:30:00Z', lineItems: [{ name: 'Laptop Air 13', quantity: 1 }], financials: { totalRevenue: 650000, netProfit: 200000 }, sellerId: { email: 'worker@shop.com' } },
    { _id: 't003', committedAt: '2025-05-18T11:15:00Z', lineItems: [{ name: 'Organic Milk', quantity: 10 }], financials: { totalRevenue: 12000, netProfit: 4000 }, sellerId: { email: 'owner@shop.com' } },
    { _id: 't004', committedAt: '2025-05-17T16:45:00Z', lineItems: [{ name: 'Apple Pack', quantity: 5 }], financials: { totalRevenue: 19000, netProfit: 7000 }, sellerId: { email: 'worker@shop.com' } },
    { _id: 't005', committedAt: '2025-04-10T10:00:00Z', lineItems: [{ name: 'Coffee Beans', quantity: 1 }], financials: { totalRevenue: 12500, netProfit: 4000 }, sellerId: { email: 'owner@shop.com' } },
  ];
  
  // Metrics (Derived from fixed data)
  const allTimeRevenue = 728500;
  const allTimeProfit = 224000;
  const assetValue = 4000000;
  const monthlyRevenue = demoTransactions.slice(0, 4).reduce((acc, t) => acc + t.financials.totalRevenue, 0);
  const monthlyProfit = demoTransactions.slice(0, 4).reduce((acc, t) => acc + t.financials.netProfit, 0);
  const healthScore = 75; // Low Stock penalty applied

  const demoInsights = [{ message: "Low Stock Alert: Organic Milk is below safety threshold.", action: "Execute purchase protocol for MILK-001." }];
  const riskCount = 2;

  return {
    // Inventory Data
    products: demoProducts,
    batches: [
      { productId: 'p001', batchNumber: 'B99', quantity: 45, expiryDate: '2025-06-10', purchasePrice: 8500 },
      { productId: 'p003', batchNumber: 'B10', quantity: 15, expiryDate: '2025-05-28', purchasePrice: 800 }, // Nearing expiry for insight
    ],
    // Sales Data
    transactions: demoTransactions,
    // Dashboard Metrics
    dashboard: {
      healthScore: healthScore,
      insights: demoInsights,
      metrics: {
        // Owner/Worker Monthly Default
        monthlyRevenue,
        monthlyNetProfit,
        totalAssetValue: assetValue,
        riskCount,
        // Admin
        totalShops: 5, totalUsers: 35
      },
      // Chart Data (Time Series)
      chartData: [
        { date: "Mar '25", value: 150000 }, { date: "Apr '25", value: 250000 }, 
        { date: "May '25", value: monthlyRevenue }
      ],
    },
  };
};

export const useDemoData = (initialScope = 'monthly') => {
  const [data, setData] = useState(generateDemoData());
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState(initialScope);

  // Function to simulate dynamic scope (just re-renders the same data for the demo)
  const switchScope = (newScope) => {
    setLoading(true);
    setTimeout(() => {
      setScope(newScope);
      setLoading(false);
    }, 500);
  };

  return {
    ...data,
    loading,
    scope,
    switchScope,
    // For Sustainability Page (BI Report)
    report: {
      summary: { netProfit: 224000, totalCOGS: 504500, totalRevenue: 728500, expiredLoss: 40000, grossMargin: 30.7 },
      comparison: { revenueGrowth: 15.5, profitGrowth: 8.2 },
      timeline: [
        { date: "Jan '25", revenue: 100000, profit: 30000 }, 
        { date: "Feb '25", revenue: 150000, profit: 45000 }, 
        { date: "Mar '25", revenue: 200000, profit: 60000 },
        { date: "Apr '25", revenue: 250000, profit: 75000 },
        { date: "May '25", revenue: 300000, profit: 85000 }
      ],
      categoryData: [
        { name: "Electronics", profit: 200000, revenue: 650000 }, 
        { name: "Drinks", profit: 13000, revenue: 37500 },
        { name: "Dairy", profit: 4000, revenue: 12000 }
      ],
      assetHealth: [{ name: 'Active Stock', value: 4000000 }, { name: 'Lost Capital', value: 40000 }]
    }
  };
};