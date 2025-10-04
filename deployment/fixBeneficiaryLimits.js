const mongoose = require('mongoose');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const DmtRemitter = require('./models/DmtRemitter');

require('dotenv').config();

async function fixBeneficiaryLimits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Fix all beneficiaries
    const beneficiaries = await DmtBeneficiary.find({ isActive: true });
    console.log(`Found ${beneficiaries.length} active beneficiaries`);

    for (const beneficiary of beneficiaries) {
      console.log(`\nFixing beneficiary: ${beneficiary.accountHolderName}`);
      console.log(`Current isVerified: ${beneficiary.isVerified}`);
      console.log(`Current remainingLimit: ${beneficiary.remainingLimit}`);
      
      // Set isVerified to true if undefined
      if (beneficiary.isVerified === undefined || beneficiary.isVerified === null) {
        beneficiary.isVerified = true;
        console.log('✅ Set isVerified to true');
      }
      
      // Set remainingLimit to monthlyLimit if not set
      if (!beneficiary.remainingLimit || beneficiary.remainingLimit === 0) {
        beneficiary.remainingLimit = beneficiary.monthlyLimit || 500000;
        console.log(`✅ Set remainingLimit to ₹${beneficiary.remainingLimit}`);
      }
      
      await beneficiary.save();
      console.log('✅ Beneficiary updated');
    }

    // Fix all remitters
    const remitters = await DmtRemitter.find({});
    console.log(`\nFound ${remitters.length} remitters`);

    for (const remitter of remitters) {
      console.log(`\nFixing remitter: ${remitter.mobile}`);
      console.log(`Current remainingLimit: ${remitter.remainingLimit}`);
      
      // Set remainingLimit to monthlyLimit if not set
      if (!remitter.remainingLimit || remitter.remainingLimit === 0) {
        remitter.remainingLimit = remitter.monthlyLimit || 200000;
        console.log(`✅ Set remainingLimit to ₹${remitter.remainingLimit}`);
      }
      
      await remitter.save();
      console.log('✅ Remitter updated');
    }

    console.log('\n🎉 All beneficiaries and remitters have been fixed!');
    console.log('You should now be able to transfer money with proper limits.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixBeneficiaryLimits();