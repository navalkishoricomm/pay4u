const mongoose = require('mongoose');
const ApiProvider = require('../models/ApiProvider');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedPaysprintProvider = async () => {
  try {
    // Check if Paysprint provider already exists
    const existingProvider = await ApiProvider.findOne({ name: 'paysprint' });
    
    if (existingProvider) {
      console.log('Paysprint API provider already exists');
      return;
    }

    // Create Paysprint API provider configuration
    const paysprintProvider = new ApiProvider({
      name: 'paysprint',
      displayName: 'Paysprint DMT',
      baseUrl: 'https://paysprint.in/service-api', // Replace with actual Paysprint base URL
      apiKey: process.env.PAYSPRINT_API_KEY || 'your_paysprint_api_key',
      apiSecret: process.env.PAYSPRINT_API_SECRET || 'your_paysprint_api_secret',
      authType: 'api_key', // or 'bearer' based on Paysprint's auth method
      headers: new Map([
        ['Content-Type', 'application/json'],
        ['Accept', 'application/json']
      ]),
      endpoints: {
        // DMT specific endpoints
        dmtRemitterRegistration: '/dmt/remitter/register',
        dmtRemitterKyc: '/dmt/remitter/kyc',
        dmtBeneficiaryRegistration: '/dmt/beneficiary/register',
        dmtBeneficiaryVerification: '/dmt/beneficiary/verify',
        dmtTransaction: '/dmt/transaction',
        dmtTransactionStatus: '/dmt/transaction/status',
        dmtRefund: '/dmt/refund'
      },
      requestFormat: 'json',
      responseFormat: 'json',
      timeout: 30000,
      retryAttempts: 3,
      isActive: true,
      priority: 1,
      successCodes: [200, 201],
      failureCodes: [400, 401, 403, 404, 500],
      pendingCodes: [202],
      commission: 0.5, // 0.5% commission
      minAmount: 100,
      maxAmount: 25000,
      supportedServices: ['dmt'],
      testMode: process.env.NODE_ENV !== 'production'
    });

    await paysprintProvider.save();
    console.log('Paysprint API provider created successfully');
    console.log('Provider ID:', paysprintProvider._id);
    
    // Display configuration info
    console.log('\n=== Paysprint Configuration ===');
    console.log('Name:', paysprintProvider.name);
    console.log('Display Name:', paysprintProvider.displayName);
    console.log('Base URL:', paysprintProvider.baseUrl);
    console.log('Auth Type:', paysprintProvider.authType);
    console.log('Is Active:', paysprintProvider.isActive);
    console.log('Test Mode:', paysprintProvider.isTestMode);
    console.log('\nEndpoints:');
    Object.entries(paysprintProvider.endpoints).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n=== Important Notes ===');
    console.log('1. Update the baseUrl with actual Paysprint API URL');
    console.log('2. Set PAYSPRINT_API_KEY and PAYSPRINT_API_SECRET in your .env file');
    console.log('3. Configure webhook URL if required');
    console.log('4. Verify endpoint paths with Paysprint documentation');
    console.log('5. Test the configuration in sandbox mode first');
    
  } catch (error) {
    console.error('Error creating Paysprint provider:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
seedPaysprintProvider();