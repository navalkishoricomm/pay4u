require('dotenv/config');
const mongoose = require('mongoose');
const dmtService = require('./services/dmtService');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u';
console.log('Connecting to MongoDB for Paysprint auth test...');

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    await dmtService.initialize();
    
    console.log('\n=== TESTING PAYSPRINT AUTHENTICATION ===');
    
    // Test a simple API call (remitter registration endpoint)
    const testEndpoint = '/dmt/remitter/register';
    const testData = {
      mobile: '9999999999',
      firstName: 'Test',
      lastName: 'User',
      pincode: '110001',
      address: 'Test Address',
      dateOfBirth: '1990-01-01',
      gstState: 'Delhi'
    };
    
    console.log('\n=== Making test API request ===');
    console.log('Endpoint:', testEndpoint);
    console.log('Test data:', testData);
    
    const response = await dmtService.makeApiRequest(testEndpoint, testData);
    
    console.log('\n=== API RESPONSE ===');
    console.log('Success:', response.success);
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.success && response.status === 200) {
      console.log('\n✅ AUTHENTICATION SUCCESSFUL!');
      console.log('Paysprint API is now working with correct JWT and AES encryption.');
    } else {
      console.log('\n❌ Authentication may still have issues.');
      console.log('Response indicates potential problems.');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error message:', error.message);
    console.error('Error details:', error.response?.data || error);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 STILL GETTING 401 - AUTHENTICATION FAILED');
      console.log('This suggests the JWT or encryption may still need adjustment.');
    }
  }
  
  process.exit(0);
}).catch(error => {
  console.error('MongoDB connection error:', error.message);
  process.exit(1);
});