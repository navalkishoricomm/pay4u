const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');
require('dotenv').config();

async function updateApiConfig() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u_production');
    console.log('Connected successfully');

    const provider = await ApiProvider.findOne({name: 'paysprint', isActive: true});
    console.log('Before Update - Current Config:');
    console.log('Base URL:', provider?.baseUrl);
    console.log('Endpoint:', provider?.endpoints?.dmtBeneficiaryVerification);

    // Update the API provider with correct URL structure
    await ApiProvider.updateOne(
      {name: 'paysprint'}, 
      {
        $set: {
          'baseUrl': 'https://api.paysprint.in/service-api/api/v1/service',
          'endpoints.dmtBeneficiaryVerification': '/dmt/kyc/beneficiary/registerbeneficiary/benenameverify'
        }
      }
    );

    const updated = await ApiProvider.findOne({name: 'paysprint', isActive: true});
    console.log('\nAfter Update - New Config:');
    console.log('Base URL:', updated?.baseUrl);
    console.log('Endpoint:', updated?.endpoints?.dmtBeneficiaryVerification);
    console.log('Full URL:', updated?.baseUrl + updated?.endpoints?.dmtBeneficiaryVerification);

    console.log('\n✅ API configuration updated successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error updating API configuration:', error);
    process.exit(1);
  }
}

updateApiConfig();