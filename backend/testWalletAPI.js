require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const jwt = require('jsonwebtoken');

async function testWalletAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Accept optional email from CLI args
    const emailArg = process.argv[2];

    // Find a test user (prefer provided email, then specific known test user, then any test, then first user)
    let user = null;
    if (emailArg) {
      user = await User.findOne({ email: emailArg });
      if (!user) console.log(`User with email ${emailArg} not found, trying fallbacks...`);
    }
    if (!user) {
      user = await User.findOne({ email: 'testuser@pay4u.com' });
    }
    if (!user) {
      user = await User.findOne({ email: { $regex: /test/i } });
    }
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
    let wallet = await Wallet.findOne({ user: user._id });
    
    if (!wallet) {
      console.log('❌ No wallet found for this user');
      
      // Check if there are any wallets with userId field instead
      const walletWithUserId = await mongoose.connection.db.collection('wallets').findOne({ userId: user._id });
      if (walletWithUserId) {
        console.log('⚠️  Found wallet with userId field instead of user field');
        console.log('Wallet data:', walletWithUserId);
      }

      // Create a wallet if missing
      console.log('Creating a new wallet with initial balance for the user...');
      wallet = await Wallet.create({
        user: user._id,
        balance: 10000,
        currency: 'INR',
        isActive: true
      });
      console.log('✅ Wallet created:', { id: wallet._id, balance: wallet.balance, currency: wallet.currency });
    } else {
      console.log('✅ Wallet found:');
      console.log('- Balance:', wallet.balance);
      console.log('- Currency:', wallet.currency);
      console.log('- Active:', wallet.isActive);
      console.log('- Created:', wallet.createdAt);
    }
    
    // Test the wallet controller logic
    console.log('\n--- Testing Wallet Controller Logic ---');
    console.log('Fetching wallet for user:', user._id.toString());
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