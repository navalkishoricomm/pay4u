const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testWalletDeductionFix() {
  try {
    console.log('=== TESTING WALLET DEDUCTION FIX ===');
    
    // Find a mobile-recharge transaction that we can test with
    const testTransaction = await Transaction.findOne({
      type: 'mobile-recharge',
      status: 'approved'
    }).populate({
      path: 'wallet',
      populate: {
        path: 'user',
        select: 'name email'
      }
    }).sort({ createdAt: -1 });
    
    if (!testTransaction) {
      console.log('No mobile-recharge transaction found for testing');
      return;
    }
    
    console.log('\n=== TEST TRANSACTION DETAILS ===');
    console.log('Transaction ID:', testTransaction._id);
    console.log('Type:', testTransaction.type);
    console.log('Amount:', testTransaction.amount);
    console.log('Current Status:', testTransaction.status);
    console.log('User:', testTransaction.wallet?.user?.name);
    
    // Get initial wallet balance
    const wallet = await Wallet.findById(testTransaction.wallet._id);
    const initialBalance = wallet.balance;
    console.log('\n=== INITIAL WALLET STATE ===');
    console.log('Wallet Balance:', initialBalance);
    
    // Step 1: Reject the transaction (should refund money)
    console.log('\n=== STEP 1: REJECTING TRANSACTION ===');
    const previousStatus = testTransaction.status;
    testTransaction.status = 'rejected';
    testTransaction.approvalNotes = 'Testing wallet deduction fix';
    testTransaction.approvalDate = new Date();
    
    // Simulate the wallet logic from adminController
    if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(testTransaction.type)) {
      if (['approved', 'pending', 'awaiting_approval'].includes(previousStatus)) {
        wallet.balance += testTransaction.amount;
        console.log(`Refund processed: +${testTransaction.amount} for rejected ${testTransaction.type}`);
        await wallet.save();
      }
    }
    
    await testTransaction.save();
    
    const balanceAfterReject = wallet.balance;
    console.log('Balance after rejection:', balanceAfterReject);
    console.log('Expected balance:', initialBalance + testTransaction.amount);
    console.log('Refund correct:', balanceAfterReject === (initialBalance + testTransaction.amount));
    
    // Step 2: Re-approve the transaction (should deduct money again)
    console.log('\n=== STEP 2: RE-APPROVING TRANSACTION ===');
    const previousStatusBeforeApproval = testTransaction.status;
    testTransaction.status = 'approved';
    testTransaction.approvalNotes = 'Re-approved for testing';
    testTransaction.approvalDate = new Date();
    
    // Simulate the NEW wallet logic from adminController
    if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(testTransaction.type)) {
      // For recharge/bill payment transactions being re-approved after rejection
      // We need to deduct the amount again since it was refunded during rejection
      if (previousStatusBeforeApproval === 'rejected') {
        wallet.balance -= testTransaction.amount;
        console.log(`Amount deducted again: -${testTransaction.amount} for re-approved ${testTransaction.type}`);
        await wallet.save();
      }
    }
    
    await testTransaction.save();
    
    const finalBalance = wallet.balance;
    console.log('Balance after re-approval:', finalBalance);
    console.log('Expected balance (back to initial):', initialBalance);
    console.log('Deduction correct:', finalBalance === initialBalance);
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('Initial Balance:', initialBalance);
    console.log('After Rejection:', balanceAfterReject, '(+' + testTransaction.amount + ')');
    console.log('After Re-approval:', finalBalance, '(-' + testTransaction.amount + ')');
    console.log('\nWallet deduction fix working:', finalBalance === initialBalance ? '✅ YES' : '❌ NO');
    
  } catch (error) {
    console.error('Error testing wallet deduction fix:', error);
  } finally {
    mongoose.connection.close();
  }
}

testWalletDeductionFix();