const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testCompleteFlow() {
  try {
    console.log('=== Testing Complete Recharge Flow with John\'s Account ===');
    
    // Step 1: Login
    console.log('\n🔐 Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'john@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.data.user._id;
    console.log('✅ Login successful! User ID:', userId);
    
    // Step 2: Check initial wallet balance via API
    console.log('\n💰 Step 2: Checking initial wallet balance via API...');
    const initialWalletResponse = await axios.get('http://localhost:5001/api/wallet/balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const initialBalance = initialWalletResponse.data.data.wallet.balance;
    console.log('Initial Balance (API):', '₹' + initialBalance);
    
    // Step 3: Check initial wallet balance directly from DB
    console.log('\n💰 Step 3: Checking initial wallet balance from database...');
    const initialWallet = await Wallet.findOne({ user: userId });
    console.log('Initial Balance (DB):', '₹' + initialWallet.balance);
    
    // Step 4: Perform a recharge
    console.log('\n🚀 Step 4: Performing mobile recharge (₹100)...');
    const rechargeResponse = await axios.post('http://localhost:5001/api/recharge/mobile', {
      mobileNumber: '9876543210',
      operator: 'AIRTEL',
      amount: 100,
      circle: 'DELHI'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Recharge Response Status:', rechargeResponse.data.status);
    console.log('Recharge Response:', rechargeResponse.data);
    
    // Step 5: Check wallet balance after recharge via API
    console.log('\n💰 Step 5: Checking wallet balance after recharge via API...');
    const finalWalletResponse = await axios.get('http://localhost:5001/api/wallet/balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const finalBalance = finalWalletResponse.data.data.wallet.balance;
    console.log('Final Balance (API):', '₹' + finalBalance);
    
    // Step 6: Check wallet balance directly from DB
    console.log('\n💰 Step 6: Checking final wallet balance from database...');
    const finalWallet = await Wallet.findOne({ user: userId });
    console.log('Final Balance (DB):', '₹' + finalWallet.balance);
    
    // Step 7: Calculate and verify deduction
    console.log('\n📊 Step 7: Verification...');
    const apiDeduction = initialBalance - finalBalance;
    const dbDeduction = initialWallet.balance - finalWallet.balance;
    
    console.log('Amount Deducted (API):', '₹' + apiDeduction);
    console.log('Amount Deducted (DB):', '₹' + dbDeduction);
    
    if (apiDeduction === 100 && dbDeduction === 100) {
      console.log('✅ SUCCESS: Balance deduction working correctly!');
      console.log('✅ Both API and Database show correct deduction of ₹100');
    } else {
      console.log('❌ ISSUE: Balance deduction not working properly!');
      console.log('Expected deduction: ₹100');
      console.log('Actual API deduction: ₹' + apiDeduction);
      console.log('Actual DB deduction: ₹' + dbDeduction);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    mongoose.disconnect();
  }
}

testCompleteFlow();