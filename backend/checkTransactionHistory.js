const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkTransactionHistory() {
  try {
    console.log('=== CHECKING TRANSACTION HISTORY FOR WALLET ISSUES ===');
    
    // Find all mobile-recharge transactions that have been updated recently
    const recentTransactions = await Transaction.find({
      type: { $in: ['mobile-recharge', 'dth-recharge', 'bill-payment'] },
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).populate({
      path: 'wallet',
      populate: {
        path: 'user',
        select: 'name email'
      }
    }).sort({ updatedAt: -1 });
    
    console.log(`\nFound ${recentTransactions.length} recent recharge/bill payment transactions:`);
    
    for (let i = 0; i < recentTransactions.length; i++) {
      const tx = recentTransactions[i];
      console.log(`\n=== TRANSACTION ${i + 1} ===`);
      console.log('ID:', tx._id);
      console.log('Type:', tx.type);
      console.log('Amount:', tx.amount);
      console.log('Status:', tx.status);
      console.log('Created:', tx.createdAt);
      console.log('Updated:', tx.updatedAt);
      console.log('User:', tx.wallet?.user?.name);
      
      // Check if this transaction has been through approve->reject->approve cycle
      const timeDiff = tx.updatedAt - tx.createdAt;
      if (timeDiff > 60000) { // More than 1 minute difference suggests status changes
        console.log('⚠️  This transaction has been updated after creation (possible status changes)');
        
        // Get current wallet balance
        const wallet = await Wallet.findById(tx.wallet._id);
        console.log('Current wallet balance:', wallet.balance);
        console.log('Wallet last updated:', wallet.updatedAt);
        
        // Check if wallet was updated after transaction
        if (wallet.updatedAt > tx.updatedAt) {
          console.log('✅ Wallet was updated after transaction (good)');
        } else {
          console.log('❌ Wallet was NOT updated after transaction (potential issue)');
        }
      }
    }
    
    // Also check for any transactions that might have been processed incorrectly
    console.log('\n=== CHECKING FOR POTENTIAL WALLET INCONSISTENCIES ===');
    
    const suspiciousTransactions = await Transaction.find({
      type: { $in: ['mobile-recharge', 'dth-recharge', 'bill-payment'] },
      status: 'approved',
      $expr: { $ne: ['$updatedAt', '$createdAt'] } // Transactions that have been updated
    }).populate('wallet').sort({ updatedAt: -1 }).limit(5);
    
    console.log(`\nFound ${suspiciousTransactions.length} potentially suspicious transactions:`);
    
    for (const tx of suspiciousTransactions) {
      console.log(`\nTransaction ${tx._id}:`);
      console.log('- Type:', tx.type, '| Amount:', tx.amount, '| Status:', tx.status);
      console.log('- Created:', tx.createdAt);
      console.log('- Updated:', tx.updatedAt);
      console.log('- Wallet Balance:', tx.wallet.balance);
      console.log('- Wallet Updated:', tx.wallet.updatedAt);
      
      // Check timing
      if (tx.wallet.updatedAt < tx.updatedAt) {
        console.log('🚨 ISSUE: Wallet not updated after transaction status change!');
      }
    }
    
  } catch (error) {
    console.error('Error checking transaction history:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkTransactionHistory();