const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const ApiProvider = require('./models/ApiProvider');
const OperatorConfig = require('./models/OperatorConfig');
const rechargeService = require('./services/rechargeService');
require('dotenv').config();

async function testControllerLogic() {
  try {
    // Disconnect any existing connection and connect fresh
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u');
    console.log('🔍 Testing Controller Logic Flow...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    
    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`);
    
    // Get or create user's wallet
    let wallet = await Wallet.findOne({ user: testUser._id });
    if (!wallet) {
      console.log('💳 Creating wallet for test user...');
      wallet = new Wallet({
        user: testUser._id,
        balance: 1000,
        currency: 'INR',
        isActive: true
      });
      await wallet.save();
      console.log('✅ Wallet created with ₹1000 balance');
    }
    
    const initialBalance = wallet.balance;
    console.log(`💰 Initial wallet balance: ₹${initialBalance}`);
    
    // Test recharge data (simulating controller logic)
    const amount = 50;
    const mobileNumber = '9876543210';
    const operator = 'AIRTEL';
    const circle = 'DELHI';
    
    console.log('\n🚀 Processing recharge (simulating controller logic)...');
    
    // Call recharge service (same as controller does)
    const result = await rechargeService.processRecharge({
      userId: testUser._id,
      serviceType: 'mobile',
      operatorCode: operator,
      mobileNumber,
      amount,
      circle
    });
    
    console.log('\n📊 Service Result:');
    console.log('Status:', result.status);
    console.log('Requires Approval:', result.requiresApproval);
    console.log('Message:', result.message);
    console.log('Transaction ID:', result.transaction.transactionId);
    
    // Simulate controller wallet deduction logic
    console.log('\n💸 Simulating Controller Wallet Deduction Logic:');
    console.log('Checking condition: status === success || status === pending || status === awaiting_approval');
    console.log(`Current status: "${result.status}"`);
    
    const shouldDeduct = result.status === 'success' || result.status === 'pending' || result.status === 'awaiting_approval';
    console.log('Should deduct wallet?', shouldDeduct);
    
    if (shouldDeduct) {
      console.log(`💰 Deducting ₹${amount} from wallet...`);
      wallet.balance -= amount;
      await wallet.save();
      console.log(`✅ Wallet balance updated: ₹${wallet.balance}`);
      console.log(`💸 Balance change: ₹${initialBalance - wallet.balance}`);
    } else {
      console.log('❌ Wallet balance NOT deducted');
    }
    
    // Check transaction in database
    const transaction = await Transaction.findOne({ 
      transactionId: result.transaction.transactionId 
    });
    
    if (transaction) {
      console.log('\n💾 Transaction in Database:');
      console.log('Status:', transaction.status);
      console.log('Processing Mode:', transaction.processingMode || 'N/A');
      console.log('Pending Reason:', transaction.pendingReason || 'N/A');
      console.log('Approval Timeout:', transaction.approvalTimeout || 'N/A');
      
      // Clean up test transaction
      await Transaction.deleteOne({ _id: transaction._id });
      console.log('\n🧹 Cleaned up test transaction');
      
      // Restore wallet balance if it was changed
      if (wallet.balance !== initialBalance) {
        wallet.balance = initialBalance;
        await wallet.save();
        console.log('🔄 Restored wallet balance to ₹' + initialBalance);
      }
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testControllerLogic();