const mongoose = require('mongoose');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const DmtRemitter = require('./models/DmtRemitter');
const dmtService = require('./services/dmtService');
require('dotenv').config();

async function testVerifyFunction() {
  try {
    console.log('Connecting to production database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u_production');
    console.log('Connected successfully\n');

    // Initialize DMT service to get updated config
    await dmtService.initialize();

    // Find an active beneficiary for testing
    const beneficiary = await DmtBeneficiary.findOne({ isActive: true });
    
    if (!beneficiary) {
      console.log('No active beneficiaries found for testing');
      return;
    }

    console.log('Testing beneficiary verification:');
    console.log('Beneficiary ID:', beneficiary._id);
    console.log('Account Number:', beneficiary.accountNumber);
    console.log('Account Holder Name:', beneficiary.accountHolderName);
    console.log('Paysprint Beneficiary ID:', beneficiary.paysprintBeneficiaryId);

    // Get API provider configuration
    console.log('\nAPI Provider Configuration:');
    console.log('Name:', dmtService.apiProvider?.name);
    console.log('Base URL:', dmtService.apiProvider?.baseUrl);
    console.log('Environment:', dmtService.apiProvider?.environment);
    console.log('Verification Endpoint:', dmtService.apiProvider?.endpoints?.dmtBeneficiaryVerification);
    console.log('Full URL:', dmtService.apiProvider?.baseUrl + dmtService.apiProvider?.endpoints?.dmtBeneficiaryVerification);

    // Find the remitter for this beneficiary
    const remitter = await DmtRemitter.findById(beneficiary.remitterId);
    if (!remitter) {
      console.log('No remitter found for this beneficiary');
      return;
    }

    console.log('\n🔄 Attempting to verify beneficiary...');
    
    // Test the verifyBeneficiary function
    const result = await dmtService.verifyBeneficiary(beneficiary._id.toString());
    
    console.log('\n✅ Verification Result:');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    
    if (result.data) {
      console.log('\nAPI Response:');
      console.log('Response Code:', result.data.response_code);
      console.log('Status:', result.data.status);
      console.log('Message:', result.data.message);
      
      if (result.data.data && result.data.data.benename) {
        console.log('\n🏦 Bank Account Name from API:', result.data.data.benename);
        console.log('Original Name:', beneficiary.accountHolderName);
        console.log('Names Match:', result.data.data.benename.toLowerCase() === beneficiary.accountHolderName.toLowerCase());
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    console.log('\nDisconnected from database');
    await mongoose.disconnect();
  }
}

testVerifyFunction();