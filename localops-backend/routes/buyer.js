const express = require('express');
const Buyer = require('../models/buyer');
const Otp = require('../models/otp');

const router = express.Router();

router.get('/buyers/check-email', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ exists: false });
  }

  try {
    const exists = await Buyer.exists({ email });
    res.json({ exists: Boolean(exists) });
  } catch (err) {
    console.error('Buyer email check failed:', err);
    res.status(500).json({ exists: false, message: 'Unable to verify email right now.' });
  }
});

router.post('/buyers', async (req, res) => {
  const { name, email, contact, password } = req.body || {};

  if (!name || !email || !contact || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const otpRecord = await Otp.findOne({ email: normalizedEmail, isVerified: true });
  if (!otpRecord) {
    return res.status(400).json({ message: 'Email not verified. Please verify your email with OTP.' });
  }

  try {
    const buyer = await Buyer.create({
      name,
      email: email.trim().toLowerCase(),
      contact,
      password,
      role: 'customer'
    });

    await Otp.deleteOne({ email: buyer.email });

    console.log(`Buyer registered: ${buyer.email}`);
    res.status(201).json({
      message: 'Buyer registered successfully',
      buyer: { id: buyer.id, email: buyer.email, name: buyer.name }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (
      err.name === 'ValidationError' ||
      err.code === 121 ||
      err?.errorResponse?.code === 121
    ) {
      const detail = err.errInfo?.details?.schemaRulesNotSatisfied?.[0];
      console.error('Buyer validation error:', err);
      return res.status(400).json({
        message: 'Invalid buyer data',
        details: detail || err.message || err.errmsg
      });
    }
    console.error('Buyer registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/buyer/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const buyer = await Buyer.findOne({ email: email.trim().toLowerCase() });
    if (!buyer || buyer.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const tokenPayload = {
      buyerId: buyer.id,
      issuedAt: Date.now()
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    console.log(`Buyer logged in: ${buyer.email}`);
    res.json({
      message: 'Login successful',
      token,
      buyer: {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email
      }
    });
  } catch (err) {
    console.error('Buyer login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/buyers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const buyer = await Buyer.findById(id).select('-password -__v');
    if (!buyer) return res.status(404).json({ message: 'Buyer not found' });
    res.json({ buyer });
  } catch (err) {
    console.error('Fetch buyer profile error:', err);
    res.status(500).json({ message: 'Error fetching buyer profile' });
  }
});

router.put('/buyers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contact, address, city, state, pincode } = req.body || {};

  try {
    const buyer = await Buyer.findById(id);
    if (!buyer) return res.status(404).json({ message: 'Buyer not found' });

    if (name) buyer.name = name;
    if (contact) buyer.contact = contact;
    if (typeof address !== 'undefined') buyer.address = address;
    if (typeof city !== 'undefined') buyer.city = city;
    if (typeof state !== 'undefined') buyer.state = state;
    if (typeof pincode !== 'undefined') buyer.pincode = pincode;

    await buyer.save();
    
    const updated = buyer.toObject();
    delete updated.password;
    delete updated.__v;
    
    res.json({ message: 'Profile updated successfully', buyer: updated });
  } catch (err) {
    console.error('Update buyer error:', err);
    res.status(500).json({ message: 'Unable to update profile' });
  }
});

module.exports = router;
