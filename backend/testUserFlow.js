const mongoose = require('mongoose');
const User = require('./models/User');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');

async function testUserFlow() {
  try {
    console.log('=== Testing Complete User Flow ===');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');
    
    // Find the test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }
    console.log('Found user:', user.email);
    
    // Find remitter for this user
    const remitter = await DmtRemitter.findOne({ userId: user._id });
    if (!remitter) {
      console.log('No remitter found for user');
      return;
    }
    console.log('Found remitter:', {
      _id: remitter._id,
      mobile: remitter.mobile,
      firstName: remitter.firstName,
      lastName: remitter.lastName
    });
    
    // Find beneficiaries for this remitter
    const beneficiaries = await DmtBeneficiary.find({ remitterId: remitter._id });
    console.log(`Found ${beneficiaries.length} beneficiaries`);
    
    if (beneficiaries.length === 0) {
      console.log('No beneficiaries found - this might be the issue!');
      return;
    }
    
    // Check each beneficiary structure
    beneficiaries.forEach((ben, index) => {
      console.log(`\n--- Beneficiary ${index + 1} ---`);
      console.log('_id:', ben._id);
      console.log('_id type:', typeof ben._id);
      console.log('accountHolderName:', ben.accountHolderName);
      console.log('isVerified:', ben.isVerified);
      console.log('isActive:', ben.isActive);
      console.log('remitterId:', ben.remitterId);
      console.log('remitterId matches:', ben.remitterId.toString() === remitter._id.toString());
    });
    
    // Test what the frontend would receive
    console.log('\n=== Frontend Data Structure ===');
    const frontendBeneficiaries = beneficiaries.map(ben => ({
      _id: ben._id,
      accountHolderName: ben.accountHolderName,
      accountNumber: ben.accountNumber,
      ifscCode: ben.ifscCode,
      bankName: ben.bankName,
      mobile: ben.mobile,
      isVerified: ben.isVerified,
      isActive: ben.isActive,
      monthlyLimit: ben.monthlyLimit,
      remainingLimit: ben.remainingLimit
    }));
    
    console.log('Frontend beneficiaries:', JSON.stringify(frontendBeneficiaries, null, 2));
    
    // Test a specific beneficiary for button actions
    if (beneficiaries.length > 0) {
      const testBen = beneficiaries[0];
      console.log('\n=== Testing Button Actions ===');
      console.log('Test beneficiary ID:', testBen._id);
      console.log('Test beneficiary ID type:', typeof testBen._id);
      console.log('Test beneficiary ID string:', testBen._id.toString());
      console.log('Is verified:', testBen.isVerified);
      console.log('Should show verify button:', !testBen.isVerified);
      console.log('Should show delete button: true');
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testUserFlow();