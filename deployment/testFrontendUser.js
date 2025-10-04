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
    
    // Test with different user accounts to see which one works
    const testAccounts = [
      { email: 'mukgarg11@gmail.com', password: 'password123' },
      { email: 'test@example.com', password: 'password123' },
      { email: 'testuser@pay4u.com', password: 'password123' },
      { email: 'john@example.com', password: 'password123' }
    ];
    
    for (const account of testAccounts) {
      try {
        console.log(`\n🔍 Testing login with: ${account.email}`);
        
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
          email: account.email,
          password: account.password
        });
        
        if (loginResponse.data.success) {
          const token = loginResponse.data.token;
          const decoded = jwt.decode(token);
          
          console.log('✅ Login successful!');
          console.log('User ID:', decoded.id);
          console.log('User Email:', decoded.email);
          
          // Test wallet balance API
          try {
            const walletResponse = await axios.get('http://localhost:5001/api/wallet/balance', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('💰 Wallet Balance via API:', walletResponse.data.data.wallet.balance);
            
            // Check direct database balance
            const wallet = await Wallet.findOne({ user: decoded.id });
            if (wallet) {
              console.log('💰 Wallet Balance in DB:', wallet.balance);
            }
            
          } catch (walletError) {
            console.log('❌ Wallet API failed:', walletError.response?.status || walletError.message);
          }
          
        }
        
      } catch (loginError) {
        console.log('❌ Login failed:', loginError.response?.status || loginError.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

testFrontendUser();