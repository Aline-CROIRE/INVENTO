const User = require('../models/User');
const Shop = require('../models/Shop');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const { sendSetupEmail } = require('../services/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

// 1. LOGIN (Includes name and phone for frontend initialization)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password'); // Ensure password field is pulled
    
    if (user && (await user.comparePassword(password))) {
      if (user.status === 'DEACTIVATED') {
        return res.status(403).json({ message: 'Account deactivated. Contact administrator.' });
      }

      return res.json({
        _id: user._id,
        email: user.email,
        name: user.name, 
        role: user.role,
        phone: user.phone, 
        shopId: user.shopId,
        token: generateToken(user._id)
      });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 2. CONNECTION HEARTBEAT (For TopBar Pulse - Fixes 404)
exports.checkStatus = async (req, res) => {
  res.status(200).json({ status: 'online' });
};

// 3. UPDATE PROFILE (Fixes 404)
// --- 3. UPDATE PROFILE (Identity Hub) - SAFE VERSION ---
exports.updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, phone } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Identity synchronized",
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email // Frontend needs this to maintain the object structure
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. UPDATE PASSWORD (Fixes 404)
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    // Explicitly select password for comparison
    const user = await User.findById(req.user.id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current credentials invalid." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Security credentials rotated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. GET ALL USERS
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

// 6. CREATE / INVITE USER
exports.createUser = async (req, res) => {
  const { email, name, role, shopName, address } = req.body;
  try {
    let shopId = req.user.shopId;
    if (req.user.role === 'ADMIN' && role === 'OWNER') {
      const newShop = await Shop.create({ name: shopName, address });
      shopId = newShop._id;
    }

    const setupToken = crypto.randomBytes(32).toString('hex');

    try {
      await sendSetupEmail(email, setupToken);
    } catch (emailErr) {
      console.error("Email error:", emailErr.message);
      return res.status(500).json({ message: "SMTP Error: Check mail server." });
    }

    const user = await User.create({
      email, name, role, shopId, setupToken,
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

// 7. TOGGLE STATUS & DELETE
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ message: "User not found" });
    user.status = user.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
    await user.save();
    return res.json(user);
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: "User deleted" });
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

// 8. SETUP PASSWORD
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
  } catch (error) { return res.status(500).json({ message: error.message }); }
};