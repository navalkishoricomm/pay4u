const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

(async () => {
  try {
    console.log('Checking backend health at', BASE_URL);
    const res = await axios.get(`${BASE_URL}/api/health`);
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Health check failed:', err.message);
    console.error('Details:', err.response?.status, JSON.stringify(err.response?.data));
  }
})();