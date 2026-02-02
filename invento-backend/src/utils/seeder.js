const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Check if an admin already exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (adminExists) {
      console.log('ℹ️ System Admin already exists, skipping seeding.');
      return;
    }

    // Create new admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('❌ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env');
      return;
    }

    await User.create({
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    console.log('✅ System Admin seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};

module.exports = seedAdmin;
