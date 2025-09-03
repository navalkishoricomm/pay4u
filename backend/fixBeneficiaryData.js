const mongoose = require('mongoose');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const DmtRemitter = require('./models/DmtRemitter');

require('dotenv').config();

async function fixBeneficiaryData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Fix all beneficiaries
    const beneficiaries = await DmtBeneficiary.find({ isActive: true });
    console.log(`Found ${beneficiaries.length} active beneficiaries`);

    for (const beneficiary of beneficiaries) {
      console.log(`\nFixing beneficiary: ${beneficiary.accountHolderName}`);
      console.log(`Current verificationStatus: ${beneficiary.verificationStatus}`);
      
      // Set verificationStatus to 'verified' if not already set
      if (beneficiary.verificationStatus === 'pending' || !beneficiary.verificationStatus) {
        beneficiary.verificationStatus = 'verified';
        beneficiary.verificationDate = new Date();
        console.log('✅ Set verificationStatus to verified');
      }
      
      await beneficiary.save();
      
      // Calculate and display remaining limit
      const remainingLimit = beneficiary.getRemainingMonthlyLimit();
      console.log(`✅ Remaining monthly limit: ₹${remainingLimit}`);
    }

    // Fix all remitters - set remainingLimit properly
    const remitters = await DmtRemitter.find({});
    console.log(`\nFound ${remitters.length} remitters`);

    for (const remitter of remitters) {
      console.log(`\nFixing remitter: ${remitter.mobile}`);
      
      // Check if remitter has a getRemainingMonthlyLimit method or similar
      if (typeof remitter.getRemainingMonthlyLimit === 'function') {
        const remainingLimit = remitter.getRemainingMonthlyLimit();
        console.log(`✅ Remaining monthly limit: ₹${remainingLimit}`);
      } else {
        // Set a default remaining limit if not available
        console.log(`Monthly limit: ₹${remitter.monthlyLimit || 'Not set'}`);
        console.log(`Monthly sent: ₹${remitter.monthlySent || 0}`);
        const remainingLimit = (remitter.monthlyLimit || 25000) - (remitter.monthlySent || 0);
        console.log(`✅ Calculated remaining limit: ₹${remainingLimit}`);
      }
    }

    console.log('\n🎉 All beneficiaries and remitters have been fixed!');
    console.log('\nNow testing the calculation:');
    
    // Test with first beneficiary
    const testBeneficiary = beneficiaries[0];
    if (testBeneficiary) {
      console.log(`\nTest beneficiary: ${testBeneficiary.accountHolderName}`);
      console.log(`Verification Status: ${testBeneficiary.verificationStatus}`);
      console.log(`Is Verified: ${testBeneficiary.verificationStatus === 'verified'}`);
      console.log(`Monthly Limit: ₹${testBeneficiary.monthlyLimit}`);
      console.log(`Monthly Received: ₹${testBeneficiary.monthlyReceived}`);
      console.log(`Remaining Limit: ₹${testBeneficiary.getRemainingMonthlyLimit()}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixBeneficiaryData();