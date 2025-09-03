const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test credentials
const testUser = {
  email: 'mukgarg11@gmail.com',
  password: 'password123'
};

// Test transaction data
const testTransaction = {
  remitterId: '68b2cff230906ef156ed8c8b', // Updated with actual remitter ID
  beneficiaryId: '68b2d43e1393cd7acc2946ae', // Updated with actual beneficiary ID
  amount: 100,
  transferMode: 'IMPS'
};

// Note: User ID is 68b5c0390c716ee12891c750 with wallet balance 10000

async function login() {
  try {
    console.log('\n=== Testing User Login ===');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function checkWalletBalance() {
  try {
    console.log('\n=== Checking Wallet Balance ===');
    const response = await axios.get(
      `${BASE_URL}/wallet/balance`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Wallet balance retrieved');
    console.log('Balance:', response.data.data.wallet.balance);
    return response.data.data.wallet.balance;
  } catch (error) {
    console.log('❌ Failed to get wallet balance:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testMoneyTransfer() {
  try {
    console.log('\n=== Testing Money Transfer ===');
    console.log('Transaction data:', testTransaction);
    
    const response = await axios.post(
      `${BASE_URL}/dmt/transaction`,
      testTransaction,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Money transfer successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('❌ Money transfer failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function runTest() {
  console.log('🚀 Starting Money Transfer Test...');
  
  // Test login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Check initial wallet balance
  const initialBalance = await checkWalletBalance();
  
  // Perform money transfer
  const transferResult = await testMoneyTransfer();
  
  // Check wallet balance after transfer
  if (transferResult) {
    console.log('\n=== Checking Balance After Transfer ===');
    setTimeout(async () => {
      const finalBalance = await checkWalletBalance();
      
      if (initialBalance !== null && finalBalance !== null) {
        const difference = initialBalance - finalBalance;
        console.log(`\n💰 Balance Change: ${difference}`);
        console.log(`Initial: ${initialBalance}, Final: ${finalBalance}`);
        
        if (difference > 0) {
          console.log('✅ Wallet deduction working correctly!');
        } else {
          console.log('❌ Wallet deduction not working - balance unchanged');
        }
      }
      
      // Close MongoDB connection
      await mongoose.connection.close();
      process.exit(0);
    }, 2000); // Wait 2 seconds for transaction to process
  } else {
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

// Run test
runTest();