const mongoose = require('mongoose');

async function dropIndex() {
  await mongoose.connect('mongodb://localhost:27017/marketmitra_db');
  console.log('Connected to DB');
  try {
    await mongoose.connection.collection('orders').dropIndex('orderNumber_1');
    console.log('Dropped index');
  } catch (err) {
    console.error('Error dropping index', err.message);
  }
  process.exit();
}

dropIndex();
