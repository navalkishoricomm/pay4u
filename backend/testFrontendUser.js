const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testFrontendUser() {
  try {
    console.log('=== Testing Frontend User Authentication ===');
    
    // Base URL for API
    const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
    console.log('Using API Base URL:', BASE_URL);

    // Test with different user accounts to see which one works
    const testAccounts = [
      { email: 'mukgarg11@gmail.com', password: 'password123' },
      { email: 'test@example.com', password: 'password123' },
      { email: 'testuser@pay4u.com', password: 'testpass123' },
      { email: 'john@example.com', password: 'password123' }
    ];
    
    for (const account of testAccounts) {
      try {
        console.log(`\n🔍 Testing login with: ${account.email}`);
        
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: account.email,
          password: account.password
        });
        
        if (loginResponse.data && loginResponse.data.status === 'success') {
          const token = loginResponse.data.token;
          const decoded = jwt.decode(token);
          
          console.log('✅ Login successful!');
          console.log('User ID:', decoded.id);
          console.log('User Email:', decoded.email || account.email);
          
          // Test wallet balance API
          try {
            const walletResponse = await axios.get(`${BASE_URL}/api/wallet/balance`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('💰 Wallet Balance via API:', walletResponse.data?.data?.wallet?.balance);
            
            // Check direct database balance
            const wallet = await Wallet.findOne({ user: decoded.id });
            if (wallet) {
              console.log('💰 Wallet Balance in DB:', wallet.balance);
            }
            
          } catch (walletError) {
            console.log('❌ Wallet API failed:', walletError.response?.status || walletError.message);
            if (walletError.response?.data) {
              console.log('Wallet API response:', JSON.stringify(walletError.response.data));
            }
          }
          
        } else {
          console.log('❌ Login response not success:', JSON.stringify(loginResponse.data));
        }
        
      } catch (loginError) {
        console.log('❌ Login failed:', loginError.response?.status || loginError.message);
        if (loginError.response?.data) {
          console.log('Login API response:', JSON.stringify(loginError.response.data));
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

testFrontendUser();