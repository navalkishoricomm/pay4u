const mongoose = require('mongoose');
const ApiProvider = require('../models/ApiProvider');
require('dotenv').config();

// Development/Mock API Configuration
const DEVELOPMENT_CONFIG = {
  name: 'paysprint',
  displayName: 'Paysprint Development',
  baseUrl: 'https://api.paysprint.in/api/v1', // Keep same URL but with mock responses
  apiKey: process.env.PAYSPRINT_API_KEY || 'dev_api_key',
  apiSecret: process.env.PAYSPRINT_API_SECRET || 'dev_api_secret',
  authType: 'bearer',
  headers: new Map([
    ['X-Partner-Id', process.env.PAYSPRINT_PARTNER_ID || 'PS003214'],
    ['X-API-Version', 'v1']
  ]),
  endpoints: {
    // DMT endpoints
    dmtRemitterRegistration: '/dmt/remitter/register',
    dmtRemitterKyc: '/dmt/remitter/kyc',
    dmtBeneficiaryRegistration: '/dmt/beneficiary/register',
    dmtBeneficiaryVerification: '/dmt/beneficiary/verify',
    dmtTransaction: '/dmt/transaction',
    dmtTransactionStatus: '/dmt/transaction/status',
    dmtRefund: '/dmt/refund',
    // Recharge endpoints
    mobileRecharge: '/recharge/mobile',
    dthRecharge: '/recharge/dth',
    checkStatus: '/recharge/status',
    getOperators: '/operators'
  },
  supportedServices: ['mobile', 'dth', 'dmt'],
  isActive: true,
  environment: 'development',
  timeout: 30000,
  retryAttempts: 3,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  },
  mockMode: true // Enable mock responses for development
};

async function setupDevelopmentConfig() {
  try {
    console.log('Setting up development configuration...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update API provider for development
    const result = await ApiProvider.findOneAndUpdate(
      { name: 'paysprint' },
      DEVELOPMENT_CONFIG,
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );

    console.log('✅ Development configuration updated:');
    console.log(`   - Environment: ${result.environment}`);
    console.log(`   - Mock Mode: ${result.mockMode || false}`);
    console.log(`   - Base URL: ${result.baseUrl}`);
    console.log(`   - Partner ID: ${result.headers.get('X-Partner-Id')}`);

    console.log('\n🔧 Development mode features:');
    console.log('   ✅ Auto-KYC verification enabled');
    console.log('   ✅ Mock API responses (when API fails)');
    console.log('   ✅ Relaxed validation');
    
    console.log('\n✅ Development setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up development configuration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
if (require.main === module) {
  setupDevelopmentConfig();
}

module.exports = { setupDevelopmentConfig, DEVELOPMENT_CONFIG };