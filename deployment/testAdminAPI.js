const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const User = require('./models/User');
const { updateTransactionStatus } = require('./controllers/adminController');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAdminAPI() {
  try {
    console.log('=== TESTING ADMIN API WALLET FIX ===');
    
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
    
    // Create mock admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found');
      return;
    }
    
    // Mock request and response objects
    const mockReq = {
      params: { id: transaction._id.toString() },
      body: { status: 'rejected', notes: 'Testing wallet fix' },
      user: { id: adminUser._id }
    };
    
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log('API Response Status:', this.statusCode);
        console.log('API Response Data:', JSON.stringify(data, null, 2));
        return this;
      }
    };
    
    console.log('\n=== TEST 1: REJECTING TRANSACTION VIA API ===');
    
    // Call the actual admin controller function
    await updateTransactionStatus(mockReq, mockRes);
    
    // Check wallet balance after rejection
    const walletAfterReject = await Wallet.findById(transaction.wallet._id);
    console.log('Wallet balance after rejection:', walletAfterReject.balance);
    console.log('Expected balance after rejection:', initialBalance + transaction.amount);
    
    // Test re-approval
    console.log('\n=== TEST 2: RE-APPROVING TRANSACTION VIA API ===');
    
    mockReq.body = { status: 'approved', notes: 'Re-approved for testing' };
    
    await updateTransactionStatus(mockReq, mockRes);
    
    // Check final wallet balance
    const finalWallet = await Wallet.findById(transaction.wallet._id);
    console.log('Final wallet balance:', finalWallet.balance);
    console.log('Expected final balance (back to initial):', initialBalance);
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Initial Balance:', initialBalance);
    console.log('After Rejection:', walletAfterReject.balance);
    console.log('Final Balance:', finalWallet.balance);
    console.log('Wallet deduction working correctly:', finalWallet.balance === initialBalance ? '✅ YES' : '❌ NO');
    
  } catch (error) {
    console.error('Error testing admin API:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminAPI();