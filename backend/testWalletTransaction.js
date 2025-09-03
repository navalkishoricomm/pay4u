const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function testWalletTransaction() {
  try {
    console.log('=== Testing Wallet Transaction ===');
    
    // Find a test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }
    
    console.log('Found user:', user.email, 'Phone:', user.phone);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '90d' }
    );
    
    // Test wallet top-up with location data
    const transactionData = {
      amount: 100,
      mobile: user.phone || '9876543210',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 10,
        altitude: 216,
        timestamp: Date.now(),
        street: 'Test Street',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        postalCode: '110001',
        formattedAddress: 'Test Street, New Delhi, Delhi 110001, India'
      }
    };
    
    console.log('Making wallet top-up request...');
    console.log('Transaction data:', JSON.stringify(transactionData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/wallet/topup', transactionData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TestScript/1.0',
        'X-Forwarded-For': '192.168.1.100'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Wait a moment for audit log to be written
    setTimeout(() => {
      console.log('Transaction test completed. Check audit logs.');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('Error testing wallet transaction:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    process.exit(1);
  }
}

testWalletTransaction();