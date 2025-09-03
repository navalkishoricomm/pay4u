require('dotenv/config');
const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');
const dmtService = require('./services/dmtService');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u';

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  // Initialize DMT service
  await dmtService.initialize();
  
  console.log('=== API PROVIDER INFO ===');
  console.log('Name:', dmtService.apiProvider.name);
  console.log('Auth Type:', dmtService.apiProvider.authType);
  console.log('API Key:', dmtService.apiProvider.apiKey ? dmtService.apiProvider.apiKey.substring(0, 20) + '...' : 'NOT SET');
  console.log('API Secret:', dmtService.apiProvider.apiSecret ? dmtService.apiProvider.apiSecret.substring(0, 20) + '...' : 'NOT SET');
  console.log('Headers Type:', typeof dmtService.apiProvider.headers);
  console.log('Headers:', dmtService.apiProvider.headers);
  
  console.log('\n=== GENERATED HEADERS ===');
  const headers = dmtService.buildHeaders();
  console.log('Generated Headers:', JSON.stringify(headers, null, 2));
  
  console.log('\n=== HEADER VALIDATION ===');
  console.log('Content-Type:', headers['Content-Type']);
  console.log('Accept:', headers['Accept']);
  console.log('Authorization:', headers['Authorization'] ? headers['Authorization'].substring(0, 20) + '...' : 'NOT SET');
  console.log('X-Partner-Id:', headers['X-Partner-Id']);
  console.log('X-API-Version:', headers['X-API-Version']);
  
  process.exit(0);
}).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});