// Test script to check what API URL is being used
console.log('Testing API URL configuration...');

// Simulate the same logic as dmtService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('API_BASE_URL:', API_BASE_URL);
console.log('Full verify-mobile URL:', `${API_BASE_URL}/dmt/remitter/verify-mobile`);

// Check environment variable
console.log('REACT_APP_API_URL env var:', process.env.REACT_APP_API_URL);