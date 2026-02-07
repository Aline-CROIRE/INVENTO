require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const seedAdmin = require('./utils/seeder');

// --- MIDDLEWARE ---
const auth = require('./middleware/auth');
const protect = auth.protect || auth;
const authorize = auth.authorize;

// --- CONTROLLERS ---
const authController = require('./controllers/authController');
const inventoryController = require('./controllers/inventoryController');
const transactionController = require('./controllers/transactionController');
const insightsController = require('./controllers/insightsController');

// --- ROUTES ---
const seedRoutes = require('./routes/seedRoutes');
const authRoutes = require('./routes/authRoutes'); // Imported to handle settings/status

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// --- DEBUGGING GUARD ---
const check = (name, fn) => {
    if (typeof fn !== 'function') {
        console.error(`🛑 CRITICAL ERROR: Controller function "${name}" is undefined. check your exports!`);
        return (req, res) => res.status(500).json({ error: `${name} is not implemented` });
    }
    return fn;
};

// --- ROUTES ---

// 1. UNIFIED AUTH & SETTINGS (Login, Profile, Password, Status, User Management)
// Using app.use with authRoutes is better than manual registration to avoid 404s
app.use('/api/auth', authRoutes);

// 2. USER MANAGEMENT (Redundant if handled inside authRoutes, but keeping as per your structure)
app.get('/api/users', protect, authorize('ADMIN', 'OWNER'), check('getUsers', authController.getUsers));
app.post('/api/users', protect, authorize('ADMIN', 'OWNER'), check('createUser', authController.createUser));
app.delete('/api/users/:id', protect, authorize('ADMIN', 'OWNER'), check('deleteUser', authController.deleteUser));
app.patch('/api/users/:id/status', protect, authorize('ADMIN', 'OWNER'), check('toggleUserStatus', authController.toggleUserStatus));

// 3. INVENTORY STRATEGY
app.get('/api/inventory', protect, check('getInventory', inventoryController.getInventory));
app.post('/api/inventory', protect, authorize('OWNER', 'WORKER'), check('addProductWithBatch', inventoryController.addProductWithBatch));
app.post('/api/inventory/bulk', protect, authorize('OWNER'), check('bulkImport', inventoryController.bulkImport));
app.patch('/api/inventory/adjust', protect, authorize('OWNER'), check('adjustStock', inventoryController.adjustStock));
app.patch('/api/inventory/:id', protect, authorize('OWNER'), check('updateProduct', inventoryController.updateProduct));
app.delete('/api/inventory/:id', protect, authorize('OWNER'), check('deleteProduct', inventoryController.deleteProduct));

// 4. COMMERCIAL HUB (Sales)
app.post('/api/sales', protect, authorize('OWNER', 'WORKER'), check('createTransaction', transactionController.createTransaction));
app.get('/api/sales/report', protect, check('getReport', transactionController.getReport));
app.delete('/api/sales/:id', protect, check('deleteSale', transactionController.deleteSale));
app.post('/api/sales/bulk', protect, authorize('OWNER'), check('bulkImportSales', transactionController.bulkImportSales));
app.delete('/api/sales/all', protect, authorize('OWNER'), check('purgeTransactions', transactionController.purgeTransactions));

// 5. INTELLIGENCE & BI
app.get('/api/insights/dashboard', protect, check('getDashboardInsights', insightsController.getDashboardInsights));
// Points to transactionController as we updated that function there earlier
app.get('/api/sales/report/detailed', protect, check('getDetailedReport', transactionController.getDetailedReport));

// 6. SYSTEM TOOLS
app.use('/api/system', seedRoutes);

// --- DB CONNECTION & START ---
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        try {
            await seedAdmin();
        } catch (e) {
            console.log('ℹ️ Seeding Note:', e.message);
        }
        app.listen(5000, () => console.log('🚀 Server running on https://invento-xidw.onrender.com'));
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
    });