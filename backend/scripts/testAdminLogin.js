const axios = require('axios');

// Base URL for backend API
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
axios.defaults.baseURL = BASE_URL;
axios.defaults.validateStatus = () => true; // don't throw on non-200

async function run() {
  try {
    console.log('Testing admin login at', BASE_URL);
    const response = await axios.post('/api/auth/login', {
      email: 'admin@pay4u.com',
      password: 'Admin@123'
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    const token = response.data?.token;
    if (token) {
      console.log('✅ Admin login succeeded. Token present:', token.length > 10);
    } else {
      console.log('❌ Admin login failed.');
    }
  } catch (err) {
    console.error('Error during admin login test:', err.message);
  }
}

run();