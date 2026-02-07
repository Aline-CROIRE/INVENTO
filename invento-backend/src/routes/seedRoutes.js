const express = require('express');
const router = express.Router();
const seedController = require('../controllers/seedController');
const auth = require('../middleware/auth');

// 1. Bulletproof Protect Check
const protect = auth.protect || auth; 

// 2. Debugging Logs (Look for these in your terminal)
console.log("--- Seed Route Initialization ---");
console.log("Protect Middleware is a:", typeof protect); 
console.log("SeedDatabase function is a:", typeof seedController.seedDatabase);
console.log("----------------------------------");

// 3. Safety logic to prevent crash
if (typeof protect !== 'function' || typeof seedController.seedDatabase !== 'function') {
    console.error("🛑 CRITICAL ERROR: seedRoutes has undefined handlers. Check exports.");
} else {
    // This will only run if both are valid functions
    router.post('/inject', protect, seedController.seedDatabase);
}

module.exports = router;