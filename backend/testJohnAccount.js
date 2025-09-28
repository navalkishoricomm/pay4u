const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testJohnAccount() {
  try {
    console.log('=== Testing John\'s Account Recharge Flow ===');
    
    // Login with John's account
    console.log('🔐 Logging in with John\'s account...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'john@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    const decoded = jwt.decode(token);
    console.log('✅ Login successful! User ID:', decoded.id);
    
    // Check initial wallet balance
    console.log('\n💰 Checking initial wallet balance...');
    const initialWalletResponse = await axios.get('http://localhost:5001/api/wallet/balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const initialBalance = initialWalletResponse.data.data.wallet.balance;
    console.log('Initial Balance:', '₹' + initialBalance);
    
    // Perform a recharge
    console.log('\n🚀 Performing mobile recharge...');
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
    
    console.log('Recharge Response:', rechargeResponse.data);
    
    // Check wallet balance after recharge
    console.log('\n💰 Checking wallet balance after recharge...');
    const finalWalletResponse = await axios.get('http://localhost:5001/api/wallet/balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const finalBalance = finalWalletResponse.data.data.wallet.balance;
    console.log('Final Balance:', '₹' + finalBalance);
    console.log('Amount Deducted:', '₹' + (initialBalance - finalBalance));
    
    if (initialBalance - finalBalance === 100) {
      console.log('✅ Balance deduction working correctly!');
    } else {
      console.log('❌ Balance deduction not working properly!');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    mongoose.disconnect();
  }
}

testJohnAccount();