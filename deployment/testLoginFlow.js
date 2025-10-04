const axios = require('axios');

// Set the same base URL as the frontend
axios.defaults.baseURL = 'http://localhost:5000';

async function testLogin() {
  try {
    console.log('Testing login with testprod@pay4u.com...');
    
    const response = await axios.post('/api/auth/login', {
      email: 'testprod@pay4u.com',
      password: 'testpass123'
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Test the exact same destructuring as the frontend
    const { token, data } = response.data;
    console.log('Token extracted:', !!token);
    console.log('User data extracted:', !!data?.user);
    console.log('User role:', data?.user?.role);
    
    console.log('✅ Login test successful!');
    
  } catch (error) {
    console.log('❌ Login test failed!');
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
    console.log('Full error:', error.message);
  }
}

testLogin();