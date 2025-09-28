const axios = require('axios');

async function testRecharge() {
  try {
    console.log('Testing recharge endpoint...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'mukgarg11@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Test recharge
    const rechargeResponse = await axios.post('http://localhost:5001/api/recharge/mobile', {
        mobileNumber: '9876543210',
        amount: 100,
        operator: 'AIRTEL',
        circle: 'DELHI'
      }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('SUCCESS - Recharge completed successfully');
    console.log('Response:', JSON.stringify(rechargeResponse.data, null, 2));
    
  } catch (error) {
    console.log('FAILED - Recharge Error:', error.message);
    if (error.response) {
      console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRecharge();