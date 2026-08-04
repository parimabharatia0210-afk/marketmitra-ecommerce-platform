/**
 * Seed script: inserts the MarketMitra admin account.
 * Run once: node scripts/seed-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../models/admin');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/marketmitra_db';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await Admin.findOne({ email: 'badalsneha2210@gmail.com' });
  if (existing) {
    console.log('Admin already exists in collection "sneha". Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash('Sneha@2210', 10);
  await Admin.create({
    name: 'Sneha',
    email: 'badalsneha2210@gmail.com',
    password: hashed
  });

  console.log('✅ Admin account seeded successfully!');
  console.log('   Collection : admin');
  console.log('   Email      : badalsneha2210@gmail.com');
  console.log('   Password   : Sneha@2210');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
