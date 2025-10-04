const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkLatestTransaction() {
  try {
    console.log('=== CHECKING LATEST TRANSACTION ===');
    
    // Get the latest transaction
    const latestTransaction = await Transaction.findOne()
      .sort({ createdAt: -1 })
      .populate({
        path: 'wallet',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });
    
    if (!latestTransaction) {
      console.log('No transactions found');
      return;
    }
    
    console.log('\n=== LATEST TRANSACTION DETAILS ===');
    console.log('Transaction ID:', latestTransaction._id);
    console.log('Type:', latestTransaction.type);
    console.log('Amount:', latestTransaction.amount);
    console.log('Status:', latestTransaction.status);
    console.log('Created At:', latestTransaction.createdAt);
    console.log('Updated At:', latestTransaction.updatedAt);
    console.log('User:', latestTransaction.wallet?.user?.name || 'Unknown');
    console.log('User Email:', latestTransaction.wallet?.user?.email || 'Unknown');
    
    if (latestTransaction.approvedBy) {
      console.log('Approved By:', latestTransaction.approvedBy);
      console.log('Approval Date:', latestTransaction.approvalDate);
      console.log('Approval Notes:', latestTransaction.approvalNotes || 'None');
    }
    
    // Get current wallet balance
    const currentWallet = await Wallet.findById(latestTransaction.wallet._id);
    console.log('\n=== WALLET DETAILS ===');
    console.log('Wallet ID:', currentWallet._id);
    console.log('Current Balance:', currentWallet.balance);
    console.log('Wallet Updated At:', currentWallet.updatedAt);
    
    // Get recent transactions for this wallet to see the pattern
    console.log('\n=== RECENT TRANSACTIONS FOR THIS WALLET ===');
    const recentTransactions = await Transaction.find({ wallet: latestTransaction.wallet._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type amount status createdAt approvalDate');
    
    recentTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type} - ₹${tx.amount} - ${tx.status} - ${tx.createdAt.toISOString()}`);
      if (tx.approvalDate) {
        console.log(`   Approved: ${tx.approvalDate.toISOString()}`);
      }
    });
    
    // Check if this is a recharge transaction that went through approve->reject->approve cycle
    if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(latestTransaction.type)) {
      console.log('\n=== RECHARGE TRANSACTION ANALYSIS ===');
      console.log('This is a recharge/bill payment transaction.');
      console.log('Expected behavior:');
      console.log('- Initial creation: Amount deducted from wallet');
      console.log('- On rejection: Amount refunded to wallet');
      console.log('- On re-approval: Amount deducted again from wallet');
      
      // Check transaction history by looking at updatedAt vs createdAt
      if (latestTransaction.updatedAt > latestTransaction.createdAt) {
        console.log('\nTransaction has been updated after creation.');
        console.log('Created:', latestTransaction.createdAt.toISOString());
        console.log('Last Updated:', latestTransaction.updatedAt.toISOString());
      }
    }
    
  } catch (error) {
    console.error('Error checking latest transaction:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkLatestTransaction();