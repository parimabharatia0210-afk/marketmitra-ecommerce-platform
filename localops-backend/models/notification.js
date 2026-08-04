const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  sellerId: { type: String, required: true, index: true },
  message: { type: String, required: true },
  orderId: { type: String },
  read: { type: Boolean, default: false }
}, {
  collection: 'notifications',
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
