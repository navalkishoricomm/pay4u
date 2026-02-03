const axios = require('axios');
const fs = require('fs');

async function testLoginEndpoint() {
  try {
    console.log('=== Testing Signup + Login Flow ===');

    // Generate a unique test user email to avoid conflicts
    const uniqueSuffix = Date.now();
    const email = `apitest_${uniqueSuffix}@pay4u.com`;
    const password = 'apitest123';

    // 1) Try signup (unprotected endpoint)
    console.log('📝 Attempting signup...');
    const signupData = { name: 'API Test', email, password, phone: '9999999999' };
    console.log('Request URL: http://localhost:5001/api/auth/signup');
    console.log('Signup Data:', signupData);

    let signupOk = false;
    try {
      const signupResp = await axios.post('http://localhost:5001/api/auth/signup', signupData, {
        timeout: 12000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Signup Status:', signupResp.status);
      console.log('✅ Signup Data:', signupResp.data);
      signupOk = true;
    } catch (signupErr) {
      const status = signupErr.response?.status;
      const data = signupErr.response?.data;
      console.log('⚠️ Signup failed:', status, data);
      // If user exists, we can still proceed to login with the same credentials
      if (status === 400 && (data?.message?.includes('already exists') || data?.status === 'fail')) {
        console.log('Proceeding to login with existing user...');
      } else {
        console.log('Signup error message:', signupErr.message);
      }
    }

    // 2) Login to obtain token
    console.log('🔐 Attempting login...');
    const loginData = { email, password };
    console.log('Request URL: http://localhost:5001/api/auth/login');
    console.log('Login Data:', loginData);

    const loginResp = await axios.post('http://localhost:5001/api/auth/login', loginData, {
      timeout: 12000,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Login Status:', loginResp.status);
    console.log('✅ Login Data:', loginResp.data);

    if (loginResp.data && loginResp.data.token) {
      const token = loginResp.data.token;
      console.log('TOKEN:', token);
      try {
        fs.writeFileSync('token.txt', token, 'utf8');
        console.log('✅ Token saved to token.txt');
      } catch (e) {
        console.log('⚠️ Failed to write token to file:', e.message);
      }

      // 3) Test protected operators endpoint using the token
      console.log('📦 Fetching operators via protected endpoint...');
      const opResp = await axios.get('http://localhost:5001/api/recharge/operators', {
        timeout: 15000,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Operators Status:', opResp.status);
      console.log('✅ Operators Count:', Array.isArray(opResp.data?.data) ? opResp.data.data.length : 'unknown');
      console.log('Sample Operators:', Array.isArray(opResp.data?.data) ? opResp.data.data.slice(0, 5) : opResp.data);
    }

  } catch (error) {
    console.log('❌ Error occurred during flow:');
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