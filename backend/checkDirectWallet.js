const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkDirectWallet() {
  try {
    console.log('=== Direct Wallet Balance Check ===');
    
    // Find test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Found user:', user.name, '(' + user.email + ')');
    console.log('User ID:', user._id);
    
    // Check wallet
    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      console.log('❌ No wallet found for user');
      return;
    }
    
    console.log('\n💰 Current Wallet Balance: ₹' + wallet.balance);
    console.log('Last Updated:', wallet.updatedAt);
    
    // Check recent transactions
    console.log('\n=== Recent Transactions ===');
    const recentTransactions = await Transaction.find({ 
      userId: user._id 
    }).sort({ createdAt: -1 }).limit(5);
    
    if (recentTransactions.length === 0) {
      console.log('No transactions found');
    } else {
      recentTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.serviceType} - ₹${tx.amount} - ${tx.status} - ${tx.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkDirectWallet();