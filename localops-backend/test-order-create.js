const mongoose = require('mongoose');
const Order = require('./models/order');
const Product = require('./models/product');
const Notification = require('./models/notification');
const Seller = require('./models/seller');

async function testPlaceOrder() {
  try {
    await mongoose.connect('mongodb://localhost:27017/marketmitra_db');
    console.log('Connected to DB');

    // 1. Fetch a product to order
    const p = await Product.findOne({});
    if (!p) {
      console.log('No products found');
      process.exit(0);
    }
    console.log('Found product:', p._id);

    const items = [{
      productId: p._id.toString(),
      name: p.name,
      price: p.finalPrice,
      quantity: 1,
      image: '',
      sellerName: 'Test Seller'
    }];

    // Simulate mapping
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate('seller', 'email shopName');
    
    // Create a map
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    const uniqueSellers = new Map();

    const updatedItems = items.map(item => {
      const dbProduct = productMap[item.productId];
      if (dbProduct && dbProduct.seller) {
        uniqueSellers.set(dbProduct.seller._id.toString(), dbProduct.seller.email);
        return { ...item, sellerId: dbProduct.seller._id.toString() };
      }
      return item;
    });

    console.log('Updated items:', updatedItems);

    const order = await Order.create({
      buyerId: '660000000000000000000000',
      buyerEmail: 'test@buyer.com',
      buyerName: 'Test Buyer',
      deliveryAddress: {
        addressLine: '123 Main',
        city: 'City',
        state: 'State',
        pincode: '123456',
        contact: '999999999'
      },
      items: updatedItems,
      totalAmount: 100,
      paymentMethod: 'COD'
    });
    console.log('Order created:', order._id);

    const notifications = Array.from(uniqueSellers.keys()).map(sellerId => ({
      sellerId,
      message: `New order placed by Test Buyer (Amount: ₹100.00)`,
      orderId: order._id
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log('Notifications created');
    }

    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
}

testPlaceOrder();
