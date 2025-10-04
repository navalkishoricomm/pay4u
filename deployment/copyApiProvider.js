const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');
require('dotenv').config();

async function copyApiProvider() {
  try {
    console.log('Connecting to development database...');
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    
    // Get API provider from development database
    const devProvider = await ApiProvider.findOne({ name: 'paysprint', isActive: true });
    
    if (!devProvider) {
      console.log('No Paysprint API provider found in development database');
      return;
    }
    
    console.log('Found API provider in development database');
    console.log('Name:', devProvider.name);
    console.log('Base URL:', devProvider.baseUrl);
    console.log('Environment:', devProvider.environment);
    
    // Store the provider data
    const providerData = devProvider.toObject();
    delete providerData._id; // Remove the _id to create a new document
    
    // Update to production configuration
    providerData.environment = 'production';
    providerData.baseUrl = 'https://api.paysprint.in/api/v1'; // Production URL
    
    await mongoose.disconnect();
    
    console.log('\nConnecting to production database...');
    await mongoose.connect('mongodb://localhost:27017/pay4u_production');
    
    // Create or update in production database
    const result = await ApiProvider.findOneAndUpdate(
      { name: 'paysprint' },
      providerData,
      { upsert: true, new: true }
    );
    
    console.log('\n✅ API Provider configured in production database:');
    console.log('Name:', result.name);
    console.log('Base URL:', result.baseUrl);
    console.log('Environment:', result.environment);
    console.log('Active:', result.isActive);
    console.log('Has Endpoints:', !!result.endpoints);
    
    if (result.endpoints) {
      console.log('DMT Beneficiary Verification Endpoint:', result.endpoints.dmtBeneficiaryVerification);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

copyApiProvider();