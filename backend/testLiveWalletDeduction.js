const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const User = require('./models/User');
const axios = require('axios');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testLiveWalletDeduction() {
  try {
    console.log('=== TESTING LIVE WALLET DEDUCTION ===');
    
    // Find a mobile-recharge transaction to test with
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
    
    // Get admin user for authentication
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }
    
    // First, let's login to get a valid JWT token
    console.log('\n=== GETTING ADMIN TOKEN ===');
    let adminToken;
    try {
      const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
        email: adminUser.email,
        password: 'admin123' // Assuming default admin password
      });
      adminToken = loginResponse.data.token;
      console.log('Admin token obtained successfully');
    } catch (error) {
      console.log('Failed to get admin token:', error.response?.data || error.message);
      return;
    }
    
    // Test 1: Reject the transaction via API
    console.log('\n=== TEST 1: REJECTING TRANSACTION VIA API ===');
    try {
      const rejectResponse = await axios.patch(
        `http://localhost:5001/api/admin/transactions/${transaction._id}`,
        {
          status: 'rejected',
          notes: 'Testing wallet deduction fix'
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Reject API Response Status:', rejectResponse.status);
      console.log('Reject API Response:', rejectResponse.data.status);
    } catch (error) {
      console.log('Reject API Error:', error.response?.data || error.message);
    }
    
    // Check wallet balance after rejection
    const walletAfterReject = await Wallet.findById(transaction.wallet._id);
    console.log('Wallet balance after rejection:', walletAfterReject.balance);
    console.log('Expected balance after rejection:', initialBalance + transaction.amount);
    console.log('Refund correct:', walletAfterReject.balance === (initialBalance + transaction.amount));
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Re-approve the transaction via API
    console.log('\n=== TEST 2: RE-APPROVING TRANSACTION VIA API ===');
    try {
      const approveResponse = await axios.patch(
        `http://localhost:5001/api/admin/transactions/${transaction._id}`,
        {
          status: 'approved',
          notes: 'Re-approved for testing wallet deduction'
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Approve API Response Status:', approveResponse.status);
      console.log('Approve API Response:', approveResponse.data.status);
    } catch (error) {
      console.log('Approve API Error:', error.response?.data || error.message);
    }
    
    // Check final wallet balance
    const finalWallet = await Wallet.findById(transaction.wallet._id);
    console.log('Final wallet balance:', finalWallet.balance);
    console.log('Expected final balance (back to initial):', initialBalance);
    console.log('Deduction correct:', finalWallet.balance === initialBalance);
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Initial Balance:', initialBalance);
    console.log('After Rejection:', walletAfterReject.balance, '(+' + transaction.amount + ')');
    console.log('Final Balance:', finalWallet.balance, '(-' + transaction.amount + ')');
    console.log('\nWallet deduction fix working:', finalWallet.balance === initialBalance ? '✅ YES' : '❌ NO');
    
    if (finalWallet.balance !== initialBalance) {
      console.log('\n🚨 ISSUE DETECTED: Wallet balance not properly restored!');
      console.log('Difference:', finalWallet.balance - initialBalance);
    }
    
  } catch (error) {
    console.error('Error testing live wallet deduction:', error);
  } finally {
    mongoose.connection.close();
  }
}

testLiveWalletDeduction();