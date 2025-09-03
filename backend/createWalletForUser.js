const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

async function createWalletForUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    // Find the test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Found user:', user.email, 'ID:', user._id);
    
    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ user: user._id });
    if (existingWallet) {
      console.log('✅ Wallet already exists with balance:', existingWallet.balance);
      return;
    }
    
    // Create wallet for test user
    const wallet = new Wallet({
      user: user._id,
      balance: 10000, // Give 10000 balance for testing
      currency: 'INR'
    });
    
    await wallet.save();
    console.log('✅ Wallet created with balance:', wallet.balance);
    console.log('Wallet ID:', wallet._id);
    
    // Verify wallet creation
    const userWithWallet = await User.findById(user._id).populate('wallet');
    console.log('✅ User wallet verification:');
    console.log('  Wallet ID:', userWithWallet.wallet._id);
    console.log('  Balance:', userWithWallet.wallet.balance);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createWalletForUser();