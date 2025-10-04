const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const ApiProvider = require('./models/ApiProvider');
const OperatorConfig = require('./models/OperatorConfig');
const rechargeService = require('./services/rechargeService');
require('dotenv').config();

async function testRechargeFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u');
    console.log('🔍 Testing Recharge Flow...');
    
    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`);
    
    // Find or create wallet
    let wallet = await Wallet.findOne({ user: testUser._id });
    if (!wallet) {
      wallet = new Wallet({
        user: testUser._id,
        balance: 10000,
        currency: 'INR'
      });
      await wallet.save();
      console.log('✅ Created wallet with ₹10000 balance');
    }
    
    const initialBalance = wallet.balance;
    console.log(`💰 Initial wallet balance: ₹${initialBalance}`);
    
    // Test recharge data
    const rechargeData = {
      userId: testUser._id,
      serviceType: 'mobile',
      operatorCode: 'AIRTEL',
      mobileNumber: '9876543210',
      amount: 50,
      circle: 'DELHI'
    };
    
    console.log('\n🚀 Processing recharge...');
    console.log('Recharge details:', JSON.stringify(rechargeData, null, 2));
    
    // Process recharge
    const result = await rechargeService.processRecharge(rechargeData);
    
    console.log('\n📊 Recharge Result:');
    console.log('Success:', result.success);
    console.log('Transaction ID:', result.transactionId);
    console.log('Status:', result.status);
    
    // Check wallet balance after recharge
    const updatedWallet = await Wallet.findOne({ user: testUser._id });
    const finalBalance = updatedWallet.balance;
    console.log(`\n💰 Final wallet balance: ₹${finalBalance}`);
    console.log(`💸 Amount deducted: ₹${initialBalance - finalBalance}`);
    
    // Check transaction record
    const transaction = await Transaction.findById(result.transactionId);
    if (transaction) {
      console.log('\n📋 Transaction Details:');
      console.log('- Amount:', transaction.amount);
      console.log('- Status:', transaction.status);
      console.log('- Processing Mode:', transaction.processingMode);
      console.log('- Created:', transaction.createdAt);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testRechargeFlow();