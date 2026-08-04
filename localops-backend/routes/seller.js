const express = require('express');

const Seller = require('../models/seller');
const Counter = require('../models/counter');
const Otp = require('../models/otp');
const Order = require('../models/order');
const Notification = require('../models/notification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/seller-logos');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });


const router = express.Router();

router.get('/sellers/check-email', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ exists: false });
  }

  try {
    const exists = await Seller.exists({ email });
    res.json({ exists: Boolean(exists) });
  } catch (err) {
    console.error('Email check failed:', err);
    res.status(500).json({ exists: false, message: 'Unable to verify email right now.' });
  }
});

router.get('/sellers', async (_req, res) => {
  try {
    const sellers = await Seller.find({}, '-password -__v').sort({ createdAt: -1 });
    res.json({ sellers });
  } catch (err) {
    console.error('Fetch sellers failed:', err);
    res.status(500).json({ message: 'Unable to fetch sellers right now.' });
  }
});

router.post('/sellers', async (req, res) => {
  const { name, email, contact, shopName, address, city, state, pincode, password, shopDescription = '', logo = null } = req.body || {};

  if (!name || !email || !contact || !shopName || !address || !city || !state || !pincode || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const otpRecord = await Otp.findOne({ email: normalizedEmail, isVerified: true });
  if (!otpRecord) {
    return res.status(400).json({ message: 'Email not verified. Please verify your email with OTP.' });
  }

  try {
    const nextSeq = await Counter.getNextSequence('sellerCode');
    const sellerCode = `S${String(nextSeq).padStart(5, '0')}`;

    const seller = await Seller.create({
      name,
      email: email.trim().toLowerCase(),
      contact,
      shopName,
      address,
      city,
      state,
      pincode,
      password,
      shopDescription,
      logo,
      sellerCode
    });

    await Otp.deleteOne({ email: seller.email });

    console.log(`Seller registered: ${seller.email}`);
    res.status(201).json({
      message: 'Seller registered successfully',
      seller: { id: seller.id, email: seller.email, name: seller.name, sellerCode: seller.sellerCode }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/seller/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const seller = await Seller.findOne({ email: email.trim().toLowerCase() });
    if (!seller || seller.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const tokenPayload = {
      sellerId: seller.id,
      issuedAt: Date.now()
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    console.log(`Seller logged in: ${seller.email}`);
    res.json({
      message: 'Login successful',
      token,
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        sellerCode: seller.sellerCode
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/sellers/:id', upload.single('logo'), async (req, res) => {
  const { id } = req.params;
  const { shopDescription } = req.body;
  
  try {
    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    if (typeof shopDescription !== 'undefined') {
      seller.shopDescription = shopDescription;
    }
    
    if (req.file) {
      // Clean up old logo directly from filesystem to save space
      if (seller.logo) {
         try {
           const oldPath = path.join(__dirname, '..', seller.logo);
           if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
         } catch(e) {
             console.error('Failed to unlink old logo', e);
         }
      }
      seller.logo = `/uploads/seller-logos/${req.file.filename}`;
    }
    
    await seller.save();

    // Do not return password in response
    const updatedSeller = seller.toObject();
    delete updatedSeller.password;
    delete updatedSeller.__v;

    res.json({ message: 'Profile updated successfully', seller: updatedSeller });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Unable to update profile right now.' });
  }
});

router.put('/sellers/:id/password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body || {};
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both passwords required' });
  }

  try {
    const seller = await Seller.findById(id);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    if (seller.password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    seller.password = newPassword;
    await seller.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// ORDERS AND NOTIFICATIONS
// ─────────────────────────────────────────────
router.get('/sellers/:id/orders', async (req, res) => {
  try {
    const orders = await Order.find({ 'items.sellerId': req.params.id }).sort({ createdAt: -1 });
    const sellerOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(i => i.sellerId === req.params.id);
      return orderObj;
    });
    res.json({ orders: sellerOrders });
  } catch (err) {
    console.error('Fetch seller orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/sellers/:id/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.orderId, { status }, { new: true });
    res.json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/sellers/:id/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ sellerId: req.params.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/sellers/:id/notifications/mark-read', async (req, res) => {
  try {
    await Notification.updateMany({ sellerId: req.params.id, read: false }, { read: true });
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

