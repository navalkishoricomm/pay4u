const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

require('dotenv').config();

async function checkUserWallet() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find test user
    const testUser = await User.findOne({ mobile: '9876543210' });
    if (!testUser) {
      console.log('Test user not found');
      return;
    }

    console.log('Test User:', testUser.name, testUser.mobile);

    // Find wallet
    const wallet = await Wallet.findOne({ user: testUser._id });
    if (!wallet) {
      console.log('Wallet not found for test user');
      return;
    }

    console.log('Wallet ID:', wallet._id);
    console.log('Wallet Balance:', wallet.balance);
    console.log('Balance Type:', typeof wallet.balance);
    console.log('Balance as Number:', Number(wallet.balance));

    // Check if balance is 0
    if (wallet.balance === 0 || wallet.balance < 1) {
      console.log('\n❌ ISSUE FOUND: Wallet balance is 0 or very low');
      console.log('This explains why maximum transfer amount is 0');
      console.log('\nSolution: Add funds to the wallet for testing');
    } else {
      console.log('\n✅ Wallet has sufficient balance for testing');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserWallet();