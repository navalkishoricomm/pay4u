const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const rechargeService = require('./services/rechargeService');
require('dotenv').config();

async function testActualRecharge() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/traepay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔍 Testing Actual Recharge Flow...');
    
    // Find a test user
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('❌ No test user found');
      process.exit(1);
    }
    
    console.log(`✅ Found test user: ${user.name} (${user.email})`);
    
    // Check wallet
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      console.log('❌ No wallet found for user');
      process.exit(1);
    }
    
    console.log(`💰 Current wallet balance: ₹${wallet.balance}`);
    
    // Ensure sufficient balance
    if (wallet.balance < 100) {
      wallet.balance = 1000;
      await wallet.save();
      console.log('💰 Updated wallet balance to ₹1000 for testing');
    }
    
    // Test recharge data
    const rechargeData = {
      userId: user._id,
      serviceType: 'mobile',
      operatorCode: 'AIRTEL',
      mobileNumber: '9876543210',
      amount: 50,
      circle: 'DELHI'
    };
    
    console.log('\n🚀 Processing recharge with data:');
    console.log(JSON.stringify(rechargeData, null, 2));
    
    // Process recharge
    const result = await rechargeService.processRecharge(rechargeData);
    
    console.log('\n📊 Recharge Result:');
    console.log(`Status: ${result.status}`);
    console.log(`Requires Approval: ${result.requiresApproval}`);
    console.log(`Message: ${result.message}`);
    console.log(`Transaction ID: ${result.transaction.transactionId}`);
    console.log('\n🔍 Debug - Controller should deduct for these statuses: success, pending, awaiting_approval');
    console.log('🔍 Debug - Actual status returned:', JSON.stringify(result.status));
    console.log('🔍 Debug - Status comparison:', {
      isSuccess: result.status === 'success',
      isPending: result.status === 'pending', 
      isAwaitingApproval: result.status === 'awaiting_approval'
    });
    
    // Check transaction in database
    const transaction = await Transaction.findById(result.transaction._id);
    console.log('\n💾 Transaction in Database:');
    console.log(`Status: ${transaction.status}`);
    console.log(`Processing Mode: ${transaction.processingMode}`);
    console.log(`Pending Reason: ${transaction.pendingReason || 'N/A'}`);
    console.log(`Admin Remarks: ${transaction.adminRemarks || 'N/A'}`);
    console.log(`Approval Timeout: ${transaction.approvalTimeout || 'N/A'}`);
    
    // Check updated wallet balance
    wallet = await Wallet.findOne({ user: user._id });
    console.log(`\n💰 Updated wallet balance: ₹${wallet.balance}`);
    
    // Clean up - delete test transaction
    await Transaction.findByIdAndDelete(result.transaction._id);
    console.log('\n🧹 Cleaned up test transaction');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing recharge:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testActualRecharge();