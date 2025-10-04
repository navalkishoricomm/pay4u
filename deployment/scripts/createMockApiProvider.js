const mongoose = require('mongoose');
const ApiProvider = require('../models/ApiProvider');

async function createMockApiProvider() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Delete existing Paysprint provider if exists
    await ApiProvider.deleteOne({ name: 'paysprint' });
    console.log('Deleted any existing Paysprint provider');

    // Create mock Paysprint API provider
    const mockProvider = new ApiProvider({
      name: 'paysprint',
      displayName: 'Paysprint (Mock)',
      baseUrl: 'https://api.paysprint.in/api/v1',
      apiKey: 'mock-api-key-12345',
      apiSecret: 'mock-api-secret-67890',
      authType: 'bearer',
      isActive: true,
      supportedServices: ['dmt'],
      headers: new Map([
        ['X-Partner-Id', 'mock-partner-id'],
        ['X-API-Version', 'v1']
      ]),
      endpoints: {
        mobileRecharge: '/recharge/mobile',
        dthRecharge: '/recharge/dth',
        checkStatus: '/transaction/status',
        dmtRemitterRegistration: '/dmt/remitter/register',
        dmtRemitterKyc: '/dmt/remitter/kyc',
        dmtBeneficiaryRegistration: '/dmt/beneficiary/register',
        dmtBeneficiaryVerification: '/dmt/beneficiary/verify',
        dmtTransaction: '/dmt/transaction',
        dmtTransactionStatus: '/dmt/transaction/status',
        dmtRefund: '/dmt/refund'
      },
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 1000
      },
      timeout: 30000,
      retryAttempts: 3,
      testMode: true
    });

    await mockProvider.save();
    console.log('Mock Paysprint API provider created successfully');
    console.log('Provider ID:', mockProvider._id);
    console.log('Name:', mockProvider.name);
    console.log('Base URL:', mockProvider.baseUrl);
    console.log('Test Mode:', mockProvider.testMode);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

createMockApiProvider();