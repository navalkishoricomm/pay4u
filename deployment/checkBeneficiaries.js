const mongoose = require('mongoose');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const DmtRemitter = require('./models/DmtRemitter');

mongoose.connect('mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all remitters
    const remitters = await DmtRemitter.find({});
    console.log('Found remitters:', remitters.length);
    
    for (const remitter of remitters) {
      console.log(`\nRemitter ID: ${remitter._id}`);
      console.log(`Mobile: ${remitter.mobile}`);
      
      // Find beneficiaries for this remitter
      const beneficiaries = await DmtBeneficiary.find({ remitterId: remitter._id, isBlocked: false });
      console.log(`Beneficiaries count: ${beneficiaries.length}`);
      
      beneficiaries.forEach((ben, index) => {
        console.log(`  Beneficiary ${index + 1}:`);
        console.log(`    _id: ${ben._id}`);
        console.log(`    accountHolderName: ${ben.accountHolderName}`);
        console.log(`    accountNumber: ${ben.accountNumber}`);
        console.log(`    verificationStatus: ${ben.verificationStatus}`);
        console.log(`    isActive: ${ben.isActive}`);
        console.log(`    isBlocked: ${ben.isBlocked}`);
      });
    }
    
    mongoose.disconnect();
  })
  .catch(console.error);