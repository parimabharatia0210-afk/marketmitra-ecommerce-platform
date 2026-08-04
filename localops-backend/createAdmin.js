const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/admin');

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/marketmitra_db';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    const email = 'badalsneha2210@gmail.com';
    const pwd = 'Sneha@2210';
    const hashed = await bcrypt.hash(pwd, 10);
    
    await Admin.findOneAndUpdate(
      { email: email.toLowerCase() },
      { name: 'Sneha Badal', email: email.toLowerCase(), password: hashed, role: 'admin' },
      { upsert: true, new: true }
    );
    console.log('Admin account upserted successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
