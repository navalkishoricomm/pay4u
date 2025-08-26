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
    console.log('MongoDB connected for transaction analysis');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Analyze transaction sequence
const analyzeTransactions = async () => {
  try {
    const userId = '68acb31a1870d6b8f84abe43';
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      console.log('Wallet not found');
      return;
    }
    
    console.log('Current wallet balance:', wallet.balance);
    
    // Get all transactions in chronological order
    const transactions = await Transaction.find({ wallet: wallet._id })
      .sort({ createdAt: 1 }); // Ascending order (oldest first)
    
    console.log('\n--- Transaction History Analysis ---');
    
    let simulatedBalance = 0; // Start from 0
    
    transactions.forEach((tx, index) => {
      console.log(`\n${index + 1}. ${tx.createdAt.toISOString()}`);
      console.log(`   Type: ${tx.type}`);
      console.log(`   Amount: ₹${tx.amount}`);
      console.log(`   Status: ${tx.status}`);
      
      // Simulate balance changes based on transaction logic
      if (tx.type === 'topup' && tx.status === 'approved') {
        simulatedBalance += tx.amount;
        console.log(`   Balance change: +₹${tx.amount} (topup approved)`);
      } else if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(tx.type)) {
        // For recharge/bill payment transactions:
        // 1. Money is deducted immediately when transaction is created
        // 2. If rejected, money is refunded
        // 3. If completed, no additional change (money already deducted)
        
        if (tx.status === 'awaiting_approval') {
          simulatedBalance -= tx.amount;
          console.log(`   Balance change: -₹${tx.amount} (deducted immediately when created)`);
        } else if (tx.status === 'rejected') {
          // Money was deducted when created (-amount), then refunded when rejected (+amount)
          // Net effect: 0, but we need to account for both operations
          console.log(`   Balance change: -₹${tx.amount} (deducted when created) then +₹${tx.amount} (refunded) = ₹0 net`);
        } else if (tx.status === 'completed') {
          // Money was deducted when created, no refund needed
          simulatedBalance -= tx.amount;
          console.log(`   Balance change: -₹${tx.amount} (deducted when created, transaction completed)`);
        }
      }
      
      console.log(`   Simulated balance after this transaction: ₹${simulatedBalance}`);
    });
    
    console.log(`\n--- Summary ---`);
    console.log(`Actual current balance: ₹${wallet.balance}`);
    console.log(`Simulated final balance: ₹${simulatedBalance}`);
    console.log(`Match: ${wallet.balance === simulatedBalance ? 'YES' : 'NO'}`);
    
    // Check for pending transactions
    const pendingTransactions = transactions.filter(tx => tx.status === 'awaiting_approval');
    console.log(`\nPending transactions: ${pendingTransactions.length}`);
    pendingTransactions.forEach(tx => {
      console.log(`- ${tx.type}: ₹${tx.amount} (${tx.createdAt.toISOString()})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error analyzing transactions:', error);
    process.exit(1);
  }
};

// Run analysis
connectDB().then(() => {
  analyzeTransactions();
});