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
    console.log('MongoDB connected for balance test');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Test balance validation
const testBalanceValidation = async () => {
  try {
    const userId = '68acb31a1870d6b8f84abe43';
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      console.log('Wallet not found');
      return;
    }
    
    console.log('Current wallet balance:', wallet.balance);
    console.log('Balance type:', typeof wallet.balance);
    
    const testAmount = 1000;
    console.log('Test amount:', testAmount);
    console.log('Amount type:', typeof testAmount);
    
    // Test the exact same validation logic
    console.log('\n--- Testing Balance Validation ---');
    console.log(`Balance validation: Current balance: ₹${wallet.balance}, Required: ₹${testAmount}, Type: ${typeof wallet.balance}, Amount Type: ${typeof testAmount}`);
    
    if (wallet.balance < parseFloat(testAmount)) {
      console.log(`INSUFFICIENT BALANCE DETECTED: ${wallet.balance} < ${parseFloat(testAmount)}`);
      console.log('Transaction should be REJECTED');
    } else {
      console.log(`Balance sufficient: ${wallet.balance} >= ${parseFloat(testAmount)}`);
      console.log('Transaction should be ALLOWED');
    }
    
    // Test with different comparison methods
    console.log('\n--- Testing Different Comparisons ---');
    console.log('wallet.balance < testAmount:', wallet.balance < testAmount);
    console.log('wallet.balance < parseFloat(testAmount):', wallet.balance < parseFloat(testAmount));
    console.log('Number(wallet.balance) < Number(testAmount):', Number(wallet.balance) < Number(testAmount));
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing balance validation:', error);
    process.exit(1);
  }
};

// Run test
connectDB().then(() => {
  testBalanceValidation();
});