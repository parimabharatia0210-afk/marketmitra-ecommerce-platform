const mongoose = require('mongoose');
const Admin = require('./models/admin');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/marketmitra_db');
  console.log('Connected to DB');

  try {
    const existing = await Admin.findOne({ email: 'badalsneha2210@gmail.com' });
    console.log('Existing admin:', existing ? existing.email : 'not found');
    
    // Check if we can create a test admin directly
    const newA = new Admin({ name: 'test', email: 'test@example.com', password: 'hash' });
    await newA.validate();
    console.log('Validation successful');
    
  } catch (err) {
    console.error('Validation Error:', err);
  } finally {
    process.exit(0);
  }
}

test();
