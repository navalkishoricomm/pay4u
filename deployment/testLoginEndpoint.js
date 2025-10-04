const axios = require('axios');

async function testLoginEndpoint() {
  try {
    console.log('=== Testing Login Endpoint Directly ===');
    
    // Test the login endpoint with a simple request
    console.log('🔍 Testing login endpoint availability...');
    
    const testData = {
      email: 'john@example.com',
      password: 'password123'
    };
    
    console.log('Request URL: http://localhost:5001/api/auth/login');
    console.log('Request Data:', testData);
    
    const response = await axios.post('http://localhost:5001/api/auth/login', testData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', response.data);
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Response Data:', error.response?.data);
    console.log('Error Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Connection refused - Backend server might not be running on port 5001');
    }
  }
}

testLoginEndpoint();