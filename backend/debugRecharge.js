const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugRecharge() {
  try {
    console.log('=== Debug Recharge Flow ===');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'john@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.data.user._id;
    console.log('User ID:', userId);
    
    // Check initial balance
    const initialWallet = await Wallet.findOne({ user: userId });
    console.log('Initial Balance (DB):', initialWallet.balance);
    
    // Make recharge request with detailed logging
    console.log('\n🚀 Making recharge request...');
    
    try {
      const rechargeResponse = await axios.post('http://localhost:5001/api/recharge/mobile', {
        mobileNumber: '9876543210',
        operator: 'AIRTEL',
        amount: 50,
        circle: 'DELHI'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Recharge Response:', JSON.stringify(rechargeResponse.data, null, 2));
      
      // Check balance immediately after
      const afterWallet = await Wallet.findOne({ user: userId });
      console.log('\nBalance After Recharge (DB):', afterWallet.balance);
      console.log('Expected Deduction: ₹50');
      console.log('Actual Deduction:', initialWallet.balance - afterWallet.balance);
      
      if (initialWallet.balance - afterWallet.balance === 50) {
        console.log('✅ Wallet deduction working correctly!');
      } else {
        console.log('❌ Wallet deduction NOT working!');
        console.log('Initial:', initialWallet.balance);
        console.log('After:', afterWallet.balance);
      }
      
    } catch (rechargeError) {
      console.log('❌ Recharge Error:', rechargeError.response?.data || rechargeError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

debugRecharge();