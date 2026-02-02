const User = require('../models/User');
const Shop = require('../models/Shop');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendSetupEmail } = require('../services/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

// 1. LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      return res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
        token: generateToken(user._id)
      });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 2. GET ALL USERS (Admin sees Owners, Owners see Workers)
exports.getUsers = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'ADMIN') {
      query = { role: 'OWNER' };
    } else {
      query = { shopId: req.user.shopId };
    }
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 3. CREATE / INVITE USER
exports.createUser = async (req, res) => {
  const { email, role, shopName, address } = req.body;
  try {
    let shopId = req.user.shopId;
    if (req.user.role === 'ADMIN' && role === 'OWNER') {
      const newShop = await Shop.create({ name: shopName, address });
      shopId = newShop._id;
    }

    const setupToken = crypto.randomBytes(32).toString('hex');

    // Attempt email
    try {
      await sendSetupEmail(email, setupToken);
    } catch (emailErr) {
      console.error("Email error:", emailErr.message);
      return res.status(500).json({ message: "SMTP Error: Check backend console for details." });
    }

    const user = await User.create({
      email, role, shopId, setupToken,
      setupTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      status: 'PENDING'
    });

    if (role === 'OWNER') {
      await Shop.findByIdAndUpdate(shopId, { ownerId: user._id });
    }

    return res.status(201).json({ message: 'User invited.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// 4. TOGGLE STATUS (Activate/Deactivate)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.status = user.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
    await user.save();
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// 5. DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// 6. SETUP PASSWORD (For invited users)
exports.setupPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      setupToken: token,
      setupTokenExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.setupToken = undefined;
    user.setupTokenExpires = undefined;
    user.status = 'ACTIVE';
    await user.save();
    return res.json({ message: 'Password set successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};