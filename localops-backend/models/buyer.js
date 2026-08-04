const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  contact: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  address: { type: String, default: '', trim: true },
  city: { type: String, default: '', trim: true },
  state: { type: String, default: '', trim: true },
  pincode: { type: String, default: '', trim: true },
  role: {
    type: String,
    enum: ['customer'],
    default: 'customer',
    required: true,
    immutable: true
  }
}, {
  collection: 'users',
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', buyerSchema);


