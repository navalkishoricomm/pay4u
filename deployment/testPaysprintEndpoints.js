require('dotenv/config');
const mongoose = require('mongoose');
const dmtService = require('./services/dmtService');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u';
console.log('Testing Paysprint API endpoints...');

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    await dmtService.initialize();
    console.log('\n=== TESTING DIFFERENT PAYSPRINT ENDPOINTS ===');
    
    // Test different possible endpoints
    const testEndpoints = [
      '/dmt/remitter/kyc',
      '/dmt/kyc',
      '/remitter/kyc',
      '/kyc',
      '/dmt/remitter/register',
      '/dmt/register',
      '/remitter/register'
    ];
    
    const testData = {
      mobile: '9999999999'
    };
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`\n--- Testing endpoint: ${endpoint} ---`);
        const response = await dmtService.makeApiRequest(endpoint, testData);
        console.log(`✅ SUCCESS for ${endpoint}:`, response.data);
      } catch (error) {
        console.log(`❌ FAILED for ${endpoint}:`, {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
      }
    }
    
  } catch (error) {
    console.error('❌ TEST SETUP FAILED:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}).catch(error => {
  console.error('MongoDB connection failed:', error);
  process.exit(1);
});