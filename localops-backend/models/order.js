const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String, default: '' },
  sellerName: { type: String, default: '' },
  sellerId: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyerId: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  buyerName: { type: String, required: true },
  deliveryAddress: {
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    contact: { type: String, required: true }
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'COD' },
  status: { type: String, default: 'Placed', enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] }
}, {
  collection: 'orders',
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
