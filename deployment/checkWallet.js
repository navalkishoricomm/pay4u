const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for wallet check');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Check wallet data
const checkWallet = async () => {
  try {
    // Find the user with ID 68acb31a1870d6b8f84abe43 (from logs)
    const userId = '68acb31a1870d6b8f84abe43';
    console.log(`Checking wallet for user: ${userId}`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.name, user.email);
    
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      console.log('Wallet not found');
      return;
    }
    
    console.log('Wallet balance:', wallet.balance);
    console.log('Wallet balance type:', typeof wallet.balance);
    
    // Get recent transactions
    const transactions = await Transaction.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log('Recent transactions:');
    transactions.forEach(tx => {
      console.log(`- ${tx.type}: ₹${tx.amount} (${tx.status}) - ${tx.createdAt}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking wallet:', error);
    process.exit(1);
  }
};

// Run check
connectDB().then(() => {
  checkWallet();
});