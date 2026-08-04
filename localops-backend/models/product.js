const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerProfiles', required: true },
  sellerCode: { type: String, required: true, uppercase: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  discountPercentage: { type: Number, min: 0, max: 90, default: 0 },
  finalPrice: { type: Number, required: true, min: 0 },
  minPurchase: { type: Number, default: 1, min: 1 },
  buyInMultiples: { type: Number, default: 1, min: 1 },
  stock: { type: Number, default: 0, min: 0 },
  images: {
    type: [String],
    validate: {
      validator: (list) => Array.isArray(list) && list.length >= 1 && list.length <= 6,
      message: 'Products require between 1 and 6 images.'
    },
    required: true
  }
}, { collection: 'products', timestamps: true });

productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

