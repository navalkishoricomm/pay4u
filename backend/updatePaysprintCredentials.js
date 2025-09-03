require('dotenv/config');
const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u';
console.log('Connecting to MongoDB:', mongoUri);

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  const provider = await ApiProvider.findOne({name: 'paysprint'});
  
  if (!provider) {
    console.log('Paysprint provider not found!');
    process.exit(1);
  }
  
  console.log('=== UPDATING PAYSPRINT CREDENTIALS ===');
  console.log('Current API Key:', provider.apiKey ? provider.apiKey.substring(0, 10) + '...' : 'NOT SET');
  console.log('Current API Secret:', provider.apiSecret ? provider.apiSecret.substring(0, 10) + '...' : 'NOT SET');
  
  // Update with the correct credentials from Paysprint
  provider.apiKey = 'MTMyZDg1Nzc5MTBiY2Q1YWZlZThmMjZjMGIyMzkyNjM='; // AUTHORISED_KEY
  provider.apiSecret = 'UFMwMDMyMTRmZjc5OTQ5MDdjMWNlMDU5NjNjYmI0OTgzZGRlYjY4Yg=='; // JWT_KEY for signing
  
  // Add AES encryption keys as additional config
  if (!provider.config) {
    provider.config = {};
  }
  provider.config.aesEncryptionKey = 'a901de13133edc22';
  provider.config.aesEncryptionIv = '2a1324e96009b15a';
  
  await provider.save();
  
  console.log('\n=== UPDATED PAYSPRINT CREDENTIALS ===');
  console.log('New API Key:', provider.apiKey.substring(0, 10) + '...');
  console.log('New API Secret (JWT_KEY):', provider.apiSecret.substring(0, 10) + '...');
  console.log('AES Encryption Key:', provider.config.aesEncryptionKey);
  console.log('AES Encryption IV:', provider.config.aesEncryptionIv);
  console.log('\nCredentials updated successfully!');
  
  process.exit(0);
}).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});