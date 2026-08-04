const express = require('express');
const crypto = require('crypto');
const Otp = require('../models/otp');
const Buyer = require('../models/buyer');
const Seller = require('../models/seller');
const Admin = require('../models/admin');
const { sendOtpEmail } = require('../utils/email');

const router = express.Router();

// Generate a random 6-digit OTP
const generateOtp = () => {
  // Use crypto for cryptographically secure random numbers
  return crypto.randomInt(100000, 999999).toString();
};

router.post('/otp/send', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const role = String(req.body.role || '').trim().toLowerCase();
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    if (role === 'buyer') {
      const exists = await Buyer.exists({ email });
      if (exists) return res.status(400).json({ message: 'Email is already registered as a buyer.' });
    } else if (role === 'seller') {
      const exists = await Seller.exists({ email });
      if (exists) return res.status(400).json({ message: 'Email is already registered as a seller.' });
    } else if (role === 'admin') {
      const exists = await Admin.exists({ email });
      if (exists) return res.status(400).json({ message: 'Admin with this email already exists.' });
    }
    // Generate new OTP
    const code = generateOtp();
    
    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });
    
    // Create new OTP record
    await Otp.create({
      email,
      code,
      isVerified: false
    });

    // Send the email
    const emailSent = await sendOtpEmail(email, code);

    if (emailSent) {
      res.json({ message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP email. Please check server configuration.' });
    }
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/otp/verify', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and OTP code are required' });
  }

  try {
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP has expired or was not sent' });
    }

    if (otpRecord.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    // Mark as verified instead of deleting right away, so the main registration endpoints can double-check
    otpRecord.isVerified = true;
    await otpRecord.save();

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
