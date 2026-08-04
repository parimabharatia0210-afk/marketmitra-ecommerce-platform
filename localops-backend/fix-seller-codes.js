const mongoose = require('mongoose');
const Seller = require('./models/seller');
const Counter = require('./models/counter');

const MONGO_URI = 'mongodb://127.0.0.1:27017/marketmitra_db';

async function fixSellers() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const sellers = await Seller.find({ $or: [{ sellerCode: { $exists: false } }, { sellerCode: '' }, { sellerCode: null }] });
  console.log(`Found ${sellers.length} sellers without sellerCode`);

  for (const seller of sellers) {
    const nextSeq = await Counter.getNextSequence('sellerCode');
    const sellerCode = `S${String(nextSeq).padStart(5, '0')}`;
    
    seller.sellerCode = sellerCode;
    await seller.save();
    console.log(`Assigned code ${sellerCode} to seller ${seller.email}`);
  }

  console.log('Finished fixing sellers');
  process.exit(0);
}

fixSellers().catch(err => {
  console.error(err);
  process.exit(1);
});
