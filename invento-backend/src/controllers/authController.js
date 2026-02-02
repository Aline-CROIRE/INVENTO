const User = require('../models/User');
const Shop = require('../models/Shop');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.comparePassword(password))) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

exports.createUser = async (req, res) => {
  const { email, role, shopName, address } = req.body;
  
  // Logic: ADMIN creates OWNER + Shop, OWNER creates WORKER
  let shopId = req.user.shopId;

  if (req.user.role === 'ADMIN' && role === 'OWNER') {
    const newShop = await Shop.create({ name: shopName, address });
    shopId = newShop._id;
  }

  const setupToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    email,
    role,
    shopId,
    setupToken,
    setupTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24h
  });

  if (role === 'OWNER') {
    await Shop.findByIdAndUpdate(shopId, { ownerId: user._id });
  }

  // Send Email (Mocked for now - functionality included)
  console.log(`Setup Link: ${process.env.FRONTEND_URL}/setup-password/${setupToken}`);
  
  res.status(201).json({ message: 'User created and email sent' });
};

exports.setupPassword = async (req, res) => {
  const { token, password } = req.body;
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

  res.json({ message: 'Password set successfully. You can now login.' });
};