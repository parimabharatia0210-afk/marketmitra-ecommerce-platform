const express = require('express');
const nodemailer = require('nodemailer');
const Order = require('../models/order');
const Product = require('../models/product');
const Notification = require('../models/notification');
const Seller = require('../models/seller');

const router = express.Router();

// Create transporter – uses Gmail via env variables
// Set MAIL_USER and MAIL_PASS in environment or .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || ''
  }
});

async function sendOrderConfirmationEmail(order) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('Email credentials not set. Skipping order email.');
    return;
  }
  const itemsHtml = order.items.map(item =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #334155;">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #334155;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #334155;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <div style="font-family:Inter,sans-serif;background:#0f172a;color:#f8fafc;padding:30px;max-width:600px;margin:0 auto;border-radius:16px;">
      <h1 style="color:#22c55e;margin-bottom:4px;">Order Placed Successfully! 🎉</h1>
      <p style="color:#94a3b8;margin-top:4px;margin-bottom:24px;">Hi ${order.buyerName}, your order has been confirmed.</p>

      <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:20px;">
        <h2 style="font-size:16px;margin:0 0 16px;color:#e2e8f0;">Order Summary</h2>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="color:#94a3b8;font-size:13px;">
              <th style="padding:8px;text-align:left;border-bottom:1px solid #334155;">Product</th>
              <th style="padding:8px;text-align:center;border-bottom:1px solid #334155;">Qty</th>
              <th style="padding:8px;text-align:right;border-bottom:1px solid #334155;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px 8px;font-weight:700;color:#e2e8f0;">Total Amount</td>
              <td style="padding:12px 8px;font-weight:800;color:#22c55e;text-align:right;font-size:18px;">₹${order.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:20px;">
        <h2 style="font-size:16px;margin:0 0 12px;color:#e2e8f0;">Delivery Address</h2>
        <p style="margin:0;color:#94a3b8;line-height:1.7;">
          ${order.deliveryAddress.addressLine}<br>
          ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}<br>
          Contact: ${order.deliveryAddress.contact}
        </p>
      </div>

      <div style="background:#1e293b;border-radius:12px;padding:20px;">
        <h2 style="font-size:16px;margin:0 0 8px;color:#e2e8f0;">Payment Method</h2>
        <p style="margin:0;color:#22c55e;font-weight:700;">Cash on Delivery (COD)</p>
      </div>

      <p style="text-align:center;color:#475569;font-size:13px;margin-top:24px;">
        Thank you for shopping with LocalOps!
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"LocalOps" <${process.env.MAIL_USER}>`,
    to: order.buyerEmail,
    subject: '✅ Order Placed Successfully – LocalOps',
    html
  });
}

// POST /api/orders – place a new order
router.post('/orders', async (req, res) => {
  const { buyerId, buyerEmail, buyerName, deliveryAddress, items, totalAmount } = req.body || {};

  if (!buyerId || !buyerEmail || !deliveryAddress || !items?.length || !totalAmount) {
    return res.status(400).json({ message: 'Missing required order fields' });
  }

  try {
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate('seller', 'email shopName');
    
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    const uniqueSellers = new Map();

    const updatedItems = items.map(item => {
      const dbProduct = productMap[item.productId];
      if (dbProduct && dbProduct.seller) {
        uniqueSellers.set(dbProduct.seller._id.toString(), dbProduct.seller.email);
        return { ...item, sellerId: dbProduct.seller._id.toString() };
      }
      return item;
    });

    const order = await Order.create({
      buyerId,
      buyerEmail,
      buyerName,
      deliveryAddress,
      items: updatedItems,
      totalAmount,
      paymentMethod: 'COD'
    });

    const notifications = Array.from(uniqueSellers.keys()).map(sellerId => ({
      sellerId,
      message: `New order placed by ${buyerName} (Amount: ₹${totalAmount.toFixed(2)})`,
      orderId: order._id
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Notify sellers via email
    Array.from(uniqueSellers.entries()).forEach(([sellerId, email]) => {
      if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        transporter.sendMail({
          from: `"LocalOps" <${process.env.MAIL_USER}>`,
          to: email,
          subject: '🎉 New Order Received! – LocalOps',
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>You have a new order!</h2>
                  <p><strong>${buyerName}</strong> has placed an order containing your products.</p>
                  <p>Please log in to your Seller Dashboard to process the order immediately.</p>
                 </div>`
        }).catch(err => console.error('Seller order email failed:', err));
      }
    });

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail(order).catch(err => {
      console.error('Order email failed:', err.message);
    });

    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// GET /api/orders/buyer/:buyerId – get orders for a buyer
router.get('/orders/buyer/:buyerId', async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.params.buyerId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

module.exports = router;
