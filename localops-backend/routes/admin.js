const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Admin = require('../models/admin');
const Buyer = require('../models/buyer');
const Seller = require('../models/seller');
const Product = require('../models/product');
const Order = require('../models/order');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'marketmitra_admin_secret_key_2024';
const SALT_ROUNDS = 10;

// ─────────────────────────────────────────────
//  POST /api/admin/register  (first-time only)
// ─────────────────────────────────────────────
router.post('/admin/register', async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({ message: 'Admin already registered. Only one admin allowed.' });
    }
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required.' });
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await Admin.create({ name, email, password: hashed });
    res.status(201).json({ message: 'Admin registered successfully', admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    console.error('Admin register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/admin/add (by existing admin)
// ─────────────────────────────────────────────
router.post('/admin/add', adminAuth, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required.' });
    }
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
       return res.status(400).json({ message: 'Admin with this email already exists.' });
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await Admin.create({ name, email: email.toLowerCase(), password: hashed, role: 'admin' });
    res.status(201).json({ message: 'New admin added successfully', admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    console.error('Admin add error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/admin/login
// ─────────────────────────────────────────────
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

  try {
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { adminId: admin._id, name: admin.name, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ message: 'Login successful', token, admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
//  GET /api/admin/dashboard-stats
// ─────────────────────────────────────────────
router.get('/admin/dashboard-stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalSellers, totalProducts, totalOrders,
           recentUsers, recentSellers, recentOrders] = await Promise.all([
      Buyer.countDocuments(),
      Seller.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Buyer.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Seller.find().sort({ createdAt: -1 }).limit(5).select('name email shopName city createdAt'),
      Order.find().sort({ createdAt: -1 }).limit(5).select('buyerName totalAmount status createdAt')
    ]);

    // Order counts by status for chart
    const orderStatusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({ totalUsers, totalSellers, totalProducts, totalOrders, recentUsers, recentSellers, recentOrders, orderStatusCounts });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
//  USER MANAGEMENT
// ─────────────────────────────────────────────
router.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] };
    }
    const users = await Buyer.find(query).select('-password -__v').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/admin/users/:id', adminAuth, async (req, res) => {
  try {
    await Buyer.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/users/:id/block', adminAuth, async (req, res) => {
  try {
    const user = await Buyer.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
//  SELLER MANAGEMENT
// ─────────────────────────────────────────────
router.get('/admin/sellers', adminAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = { $or: [{ name: { $regex: search, $options: 'i' } }, { shopName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] };
    }
    const sellers = await Seller.find(query).select('-password -__v').sort({ createdAt: -1 });
    res.json({ sellers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/sellers/:id/approve', adminAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });
    seller.isApproved = !seller.isApproved;
    await seller.save();
    res.json({ message: `Seller ${seller.isApproved ? 'approved' : 'rejected'}`, isApproved: seller.isApproved });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/admin/sellers/:id', adminAuth, async (req, res) => {
  try {
    await Seller.findByIdAndDelete(req.params.id);
    res.json({ message: 'Seller deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
//  PRODUCT MANAGEMENT
// ─────────────────────────────────────────────
router.get('/admin/products', adminAuth, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    const products = await Product.find(query).populate('seller', 'shopName sellerCode').sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/admin/products/:id', adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
//  ORDER MANAGEMENT
// ─────────────────────────────────────────────
router.get('/admin/orders', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
//  SETTINGS – Change Password
// ─────────────────────────────────────────────
router.put('/admin/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required' });

    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    admin.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await admin.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
