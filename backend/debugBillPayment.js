const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');
const Wallet = require('./models/Wallet');

async function debugBillPayment() {
  try {
    console.log('🔍 Debugging Bill Payment Submission...');
    
    // Find test user account
    const user = await User.findOne({ email: 'john@example.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    
    // Check wallet balance or create wallet
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      console.log('💰 Creating wallet for user...');
      wallet = new Wallet({
        user: user._id,
        balance: 1000 // Starting with ₹1000
      });
      await wallet.save();
      console.log('✅ Wallet created with ₹1000 balance');
    }
    
    console.log(`💰 Initial wallet balance: ₹${wallet.balance}`);
    
    // Login to get JWT token
    console.log('🔐 Logging in...');
    let token;
    try {
      const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
         email: 'john@example.com',
         password: 'password123'
       });
      
      if (!loginResponse.data.token) {
        console.log('❌ Login failed - no token received');
        console.log('Response:', loginResponse.data);
        return;
      }
      
      token = loginResponse.data.token;
      console.log('✅ Login successful');
    } catch (loginError) {
      console.log('❌ Login request failed:');
      console.log('Status:', loginError.response?.status);
      console.log('Error:', loginError.response?.data || loginError.message);
      return;
    }
    
    // Test bill payment submission
    console.log('💡 Testing bill payment submission...');
    
    const billPaymentData = {
      type: 'bill-payment',
      amount: 100,
      metadata: {
        billType: 'electricity',
        billerId: 'adani',
        consumerNumber: '123456789',
        customerName: 'John Doe'
      }
    };
    
    console.log('📤 Sending bill payment request:', JSON.stringify(billPaymentData, null, 2));
    
    try {
      const billResponse = await axios.post('http://localhost:5001/api/transactions/process', billPaymentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Bill payment response:', JSON.stringify(billResponse.data, null, 2));
      
      // Check wallet balance after bill payment
      const updatedWallet = await Wallet.findOne({ user: user._id });
      console.log(`💰 Wallet balance after bill payment: ₹${updatedWallet.balance}`);
      
      const deduction = wallet.balance - updatedWallet.balance;
      console.log(`💸 Amount deducted: ₹${deduction}`);
      
      if (deduction === 100) {
        console.log('✅ Bill payment deduction working correctly!');
      } else {
        console.log('❌ Bill payment deduction NOT working!');
      }
      
    } catch (error) {
      console.log('❌ Bill payment request failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        console.log('🔍 This might be a validation or balance issue');
      } else if (error.response?.status === 401) {
        console.log('🔍 This might be an authentication issue');
      } else if (error.response?.status === 500) {
        console.log('🔍 This might be a server error');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugBillPayment();