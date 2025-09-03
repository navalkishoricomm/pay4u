require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const jwt = require('jsonwebtoken');

async function testWalletAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find a test user
    const user = await User.findOne({ email: { $regex: /test/i } });
    if (!user) {
      console.log('No test user found, using first available user');
      const firstUser = await User.findOne({ role: 'user' });
      if (!firstUser) {
        console.log('No users found!');
        return;
      }
      user = firstUser;
    }
    
    console.log(`Testing with user: ${user.email} (ID: ${user._id})`);
    
    // Generate a JWT token for this user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '90d'
    });
    
    console.log('Generated JWT token:', token.substring(0, 50) + '...');
    
    // Find the user's wallet
    const wallet = await Wallet.findOne({ user: user._id });
    
    if (!wallet) {
      console.log('❌ No wallet found for this user');
      
      // Check if there are any wallets with userId field instead
      const walletWithUserId = await mongoose.connection.db.collection('wallets').findOne({ userId: user._id });
      if (walletWithUserId) {
        console.log('⚠️  Found wallet with userId field instead of user field');
        console.log('Wallet data:', walletWithUserId);
      }
    } else {
      console.log('✅ Wallet found:');
      console.log('- Balance:', wallet.balance);
      console.log('- Currency:', wallet.currency);
      console.log('- Active:', wallet.isActive);
      console.log('- Created:', wallet.createdAt);
    }
    
    // Test the wallet controller logic
    console.log('\n--- Testing Wallet Controller Logic ---');
    const mockReq = {
      user: { id: user._id }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`Response Status: ${code}`);
          console.log('Response Data:', JSON.stringify(data, null, 2));
        }
      })
    };
    
    // Simulate the getMyWallet controller
    const walletController = require('./controllers/walletController');
    await walletController.getMyWallet(mockReq, mockRes);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testWalletAPI();