const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Seller = require('../models/seller');

const DATA_FILE = path.join(__dirname, '..', 'sellers.json');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/marketmitra_db';

async function migrate() {
  if (!fs.existsSync(DATA_FILE)) {
    console.warn('sellers.json not found. Nothing to migrate.');
    return;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!raw) {
    console.warn('sellers.json is empty. Nothing to migrate.');
    return;
  }

  const sellersFromFile = JSON.parse(raw);
  if (!Array.isArray(sellersFromFile) || sellersFromFile.length === 0) {
    console.warn('No seller records found in sellers.json.');
    return;
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for migration');

  let imported = 0;
  for (const record of sellersFromFile) {
    if (!record.email) continue;
    const normalizedEmail = String(record.email).trim().toLowerCase();
    const payload = {
      name: record.name || '',
      email: normalizedEmail,
      contact: record.contact || '',
      shopName: record.shopName || '',
      address: record.address || '',
      city: record.city || '',
      state: record.state || '',
      pincode: record.pincode || '',
      password: record.password || '',
      shopDescription: record.shopDescription || '',
      logo: record.logo || null
    };

    await Seller.updateOne(
      { email: normalizedEmail },
      { $set: payload },
      { upsert: true }
    );
    imported += 1;
  }

  console.log(`Upserted ${imported} seller record(s) into MongoDB.`);
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
