require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/Swagger');
const seedAdmin = require('./utils/seeder');

// Middleware
const { protect, authorize } = require('./middleware/auth');

// Controllers
const authController = require('./controllers/authController');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Auth Routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/setup-password', authController.setupPassword);

// User Management Routes (FIXED: Ensure these functions exist in authController)
app.get('/api/users', protect, authorize('ADMIN', 'OWNER'), authController.getUsers);
app.post('/api/users', protect, authorize('ADMIN', 'OWNER'), authController.createUser);
app.patch('/api/users/:id/status', protect, authorize('ADMIN', 'OWNER'), authController.toggleUserStatus);
app.delete('/api/users/:id', protect, authorize('ADMIN', 'OWNER'), authController.deleteUser);

// Engine Routes
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));

// Database
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    await seedAdmin();
  })
  .catch(err => console.error('❌ DB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));