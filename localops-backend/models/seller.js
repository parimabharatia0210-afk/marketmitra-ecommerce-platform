const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  contact: { type: String, required: true, trim: true },
  shopName: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  shopDescription: { type: String, default: '' },
  logo: { type: String, default: null },
  sellerCode: { type: String, required: true, unique: true, uppercase: true }
}, { collection: 'sellerprofile', timestamps: true });



module.exports = mongoose.models.Seller || mongoose.model('SellerProfiles', sellerSchema);


