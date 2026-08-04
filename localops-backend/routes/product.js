const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Seller = require('../models/seller');
const Product = require('../models/product');

const router = express.Router();

const PRODUCT_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'product-images');
if (!fs.existsSync(PRODUCT_UPLOAD_DIR)) {
  fs.mkdirSync(PRODUCT_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 6 } });

router.post('/products', upload.array('images', 6), async (req, res) => {
  const { name, description, price, discountPercentage = 0, minPurchase = 1, buyInMultiples = 1, sellerCode, sellerId, stock = 0 } = req.body || {};

  if (!name || !description || typeof price === 'undefined') {
    return res.status(400).json({ message: 'Name, description, and price are required.' });
  }
  if (!sellerCode && !sellerId) {
    return res.status(400).json({ message: 'Seller identifier (sellerCode or sellerId) is required.' });
  }

  const files = req.files || [];
  if (files.length < 1) {
    return res.status(400).json({ message: 'Upload at least one product image.' });
  }

  try {
    const seller = sellerId
      ? await Seller.findById(sellerId)
      : await Seller.findOne({ sellerCode: String(sellerCode || '').toUpperCase() });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const numericPrice = Number(price);
    const numericDiscount = Number(discountPercentage) || 0;
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'Price must be a positive number.' });
    }
    if (numericDiscount < 0 || numericDiscount > 90) {
      return res.status(400).json({ message: 'Discount percentage must be between 0 and 90.' });
    }

    const finalPrice = Math.max(0, Number((numericPrice - (numericPrice * numericDiscount) / 100).toFixed(2)));
    const images = files.map((file) => `/uploads/product-images/${file.filename}`);

    const product = await Product.create({
      seller: seller._id,
      sellerCode: seller.sellerCode,
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      discountPercentage: numericDiscount,
      finalPrice,
      minPurchase: Number(minPurchase) || 1,
      buyInMultiples: Number(buyInMultiples) || 1,
      stock: Number(stock) || 0,
      images
    });

    res.status(201).json({
      message: 'Product listed successfully',
      product
    });
  } catch (err) {
    console.error('Product creation failed. Error details:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed: ' + Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Unable to create product right now. ' + (err.message || '') });
  }
});

router.get('/products', async (req, res) => {
  const { sellerCode } = req.query;
  const filter = sellerCode ? { sellerCode: String(sellerCode).toUpperCase() } : {};

  try {
    const products = await Product.find(filter)
      .populate('seller', 'shopName name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ products });
  } catch (err) {
    console.error('Fetch products failed:', err);
    res.status(500).json({ message: 'Unable to fetch products right now.' });
  }
});

router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { price, discountPercentage, stock } = req.body || {};

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (typeof price !== 'undefined') {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: 'Price must be a positive number.' });
      }
      product.price = numericPrice;
    }

    if (typeof discountPercentage !== 'undefined') {
      const numericDiscount = Number(discountPercentage);
      if (Number.isNaN(numericDiscount) || numericDiscount < 0 || numericDiscount > 90) {
        return res.status(400).json({ message: 'Discount percentage must be between 0 and 90.' });
      }
      product.discountPercentage = numericDiscount;
    }

    if (typeof stock !== 'undefined') {
      const numericStock = Number(stock);
      if (Number.isNaN(numericStock) || numericStock < 0) {
        return res.status(400).json({ message: 'Stock must be a positive number.' });
      }
      product.stock = numericStock;
    }

    // Recalculate final price
    product.finalPrice = Math.max(0, Number((product.price - (product.price * product.discountPercentage) / 100).toFixed(2)));

    await product.save();

    res.json({ message: 'Product updated successfully', product });
  } catch (err) {
    console.error('Update product failed:', err);
    res.status(500).json({ message: 'Unable to update product right now.' });
  }
});

router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Optional: Delete images from the file system here
    if (deletedProduct.images && deletedProduct.images.length > 0) {
      deletedProduct.images.forEach(imagePath => {
        // imagePath is like '/uploads/product-images/1711090000000-image.png'
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    res.json({ message: 'Product deleted successfully', id });
  } catch (err) {
    console.error('Delete product failed:', err);
    res.status(500).json({ message: 'Unable to delete product right now.' });
  }
});

module.exports = router;

