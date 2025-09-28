const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAdminControllerFix() {
  try {
    console.log('=== TESTING ADMIN CONTROLLER WALLET FIX ===');
    
    // Find the latest mobile-recharge transaction
    const transaction = await Transaction.findOne({
      type: 'mobile-recharge',
      status: 'approved'
    }).populate('wallet').sort({ createdAt: -1 });
    
    if (!transaction) {
      console.log('No mobile-recharge transaction found');
      return;
    }
    
    console.log('\n=== TESTING TRANSACTION ===');
    console.log('Transaction ID:', transaction._id);
    console.log('Type:', transaction.type);
    console.log('Amount:', transaction.amount);
    console.log('Current Status:', transaction.status);
    
    // Get initial wallet state
    const wallet = await Wallet.findById(transaction.wallet._id);
    const initialBalance = wallet.balance;
    console.log('Initial Wallet Balance:', initialBalance);
    
    // Test 1: Reject the transaction (simulate admin action)
    console.log('\n=== TEST 1: REJECTING TRANSACTION ===');
    const previousStatus1 = transaction.status;
    transaction.status = 'rejected';
    transaction.approvalNotes = 'Testing wallet fix';
    transaction.approvalDate = new Date();
    
    await transaction.save();
    console.log('Transaction status updated to rejected');
    
    // Apply wallet logic for rejection
    if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(transaction.type)) {
      if (['approved', 'pending', 'awaiting_approval'].includes(previousStatus1)) {
        wallet.balance += transaction.amount;
        console.log(`Refund processed: +${transaction.amount} for rejected ${transaction.type}`);
        await wallet.save();
        console.log('Wallet balance after refund:', wallet.balance);
      }
    }
    
    // Test 2: Re-approve the transaction
    console.log('\n=== TEST 2: RE-APPROVING TRANSACTION ===');
    const previousStatus2 = transaction.status;
    transaction.status = 'approved';
    transaction.approvalNotes = 'Re-approved for testing';
    transaction.approvalDate = new Date();
    
    await transaction.save();
    console.log('Transaction status updated to approved');
    
    // Apply wallet logic for approval
    if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(transaction.type)) {
      if (previousStatus2 === 'rejected') {
        wallet.balance -= transaction.amount;
        console.log(`Amount deducted again: -${transaction.amount} for re-approved ${transaction.type}`);
        await wallet.save();
        console.log('Wallet balance after deduction:', wallet.balance);
      }
    }
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Initial Balance:', initialBalance);
    console.log('Final Balance:', wallet.balance);
    console.log('Balance should be same as initial:', wallet.balance === initialBalance ? '✅ YES' : '❌ NO');
    
    // Check if wallet was actually saved
    const freshWallet = await Wallet.findById(wallet._id);
    console.log('Fresh wallet balance from DB:', freshWallet.balance);
    console.log('Wallet last updated:', freshWallet.updatedAt);
    
    // Check transaction timestamps
    const freshTransaction = await Transaction.findById(transaction._id);
    console.log('Transaction last updated:', freshTransaction.updatedAt);
    
    if (freshWallet.updatedAt >= freshTransaction.updatedAt) {
      console.log('✅ Wallet was updated after transaction');
    } else {
      console.log('❌ Wallet was NOT updated after transaction - THIS IS THE ISSUE!');
    }
    
  } catch (error) {
    console.error('Error testing admin controller fix:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminControllerFix();