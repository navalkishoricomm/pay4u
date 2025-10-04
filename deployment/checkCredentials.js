require('dotenv/config');
const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u';
console.log('Connecting to MongoDB:', mongoUri);

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  const provider = await ApiProvider.findOne({name: 'paysprint'});
  
  if (!provider) {
    console.log('Paysprint provider not found!');
    process.exit(1);
  }
  
  console.log('=== PAYSPRINT API CREDENTIALS ===');
  console.log('API Key:', provider.apiKey ? provider.apiKey.substring(0, 10) + '...' : 'NOT SET');
  console.log('API Secret:', provider.apiSecret ? provider.apiSecret.substring(0, 10) + '...' : 'NOT SET');
  console.log('Auth Type:', provider.authType);
  console.log('Base URL:', provider.baseUrl);
  console.log('Headers:', provider.headers);
  console.log('Is Active:', provider.isActive);
  
  process.exit(0);
}).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});