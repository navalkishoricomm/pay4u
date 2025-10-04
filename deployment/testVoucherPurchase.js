const mongoose = require('mongoose');
const BrandVoucher = require('./models/BrandVoucher');
const VoucherDenomination = require('./models/VoucherDenomination');
const VoucherOrder = require('./models/VoucherOrder');
const Wallet = require('./models/Wallet');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
require('dotenv').config();

async function testVoucherPurchase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find a test user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found');
      return;
    }
    console.log('Found user:', user._id);

    // Find a denomination
    const denomination = await VoucherDenomination.findOne({ isActive: true }).populate('brandVoucher');
    if (!denomination) {
      console.log('No active denominations found');
      return;
    }
    console.log('Found denomination:', denomination._id);

    // Check wallet
    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      console.log('No wallet found for user');
      return;
    }
    console.log('Wallet balance:', wallet.balance);

    // Test getUserPurchaseCount
    console.log('Testing getUserPurchaseCount...');
    const userPurchaseCount = await VoucherOrder.getUserPurchaseCount(user._id, denomination._id);
    console.log('User purchase count:', userPurchaseCount);

    // Test denomination methods
    console.log('Testing denomination methods...');
    console.log('Discounted price:', denomination.discountedPrice);
    console.log('Discount amount:', denomination.discountAmount);
    console.log('Can user purchase:', denomination.canUserPurchase(userPurchaseCount, 1));
    console.log('Is quantity available:', denomination.isQuantityAvailable(1));

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testVoucherPurchase();