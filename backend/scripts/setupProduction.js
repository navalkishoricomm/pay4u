const mongoose = require('mongoose');
const ApiProvider = require('../models/ApiProvider');
require('dotenv').config();

// Production Paysprint API Configuration
const PRODUCTION_CONFIG = {
  name: 'paysprint',
  displayName: 'Paysprint Production',
  baseUrl: 'https://api.paysprint.in/service-api/api/v1/service', // Production URL based on documentation
  apiKey: process.env.PAYSPRINT_API_KEY || 'YOUR_PRODUCTION_API_KEY',
  apiSecret: process.env.PAYSPRINT_API_SECRET || 'YOUR_PRODUCTION_API_SECRET',
  authType: 'bearer',
  headers: new Map([
    ['X-Partner-Id', process.env.PAYSPRINT_PARTNER_ID || 'YOUR_PARTNER_ID'],
    ['X-API-Version', 'v1']
  ]),
  endpoints: {
    // DMT endpoints for production
    dmtRemitterRegistration: '/dmt/remitter/register',
    dmtRemitterKyc: '/dmt/remitter/kyc',
    dmtBeneficiaryRegistration: '/dmt/beneficiary/register',
    dmtBeneficiaryVerification: '/dmt/kyc/beneficiary/registerbeneficiary/benenameverify',
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
  environment: 'production',
  timeout: 30000,
  retryAttempts: 3,
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
};

async function setupProductionConfig() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update or create Paysprint API provider
    console.log('Updating Paysprint API provider to production configuration...');
    
    const result = await ApiProvider.findOneAndUpdate(
      { name: 'paysprint' },
      PRODUCTION_CONFIG,
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );

    console.log('✅ Paysprint API provider updated successfully:');
    console.log(`   - Name: ${result.name}`);
    console.log(`   - Environment: ${result.environment}`);
    console.log(`   - Base URL: ${result.baseUrl}`);
    console.log(`   - Supported Services: ${result.supportedServices.join(', ')}`);
    console.log(`   - Active: ${result.isActive}`);

    console.log('\n⚠️  IMPORTANT: Please update your .env file with the following variables:');
    console.log('   PAYSPRINT_API_KEY=your_production_api_key');
    console.log('   PAYSPRINT_API_SECRET=your_production_api_secret');
    console.log('   PAYSPRINT_PARTNER_ID=your_partner_id');

    console.log('\n✅ Production configuration setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up production configuration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
if (require.main === module) {
  setupProductionConfig();
}

module.exports = { setupProductionConfig, PRODUCTION_CONFIG };