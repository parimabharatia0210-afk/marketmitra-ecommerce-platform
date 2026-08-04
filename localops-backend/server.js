const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const sellerRoutes = require('./routes/seller');
const buyerRoutes = require('./routes/buyer');
const productRoutes = require('./routes/product');
const otpRoutes = require('./routes/otp');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/marketmitra_db';

const UPLOADS_DIR = path.join(__dirname, 'uploads', 'shop-logos');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LocalOps API is running' });
});

app.post('/api/upload/logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const logoPath = `/uploads/shop-logos/${req.file.filename}`;
  res.json({ logo: logoPath });
});

app.use('/api', sellerRoutes);
app.use('/api', buyerRoutes);
app.use('/api', productRoutes);
app.use('/api', otpRoutes);
app.use('/api', orderRoutes);
app.use('/api', adminRoutes);

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Backend API running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection failed', err);
    process.exit(1);
  }
}

start();

