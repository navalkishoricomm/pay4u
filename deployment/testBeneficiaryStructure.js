const mongoose = require('mongoose');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const DmtRemitter = require('./models/DmtRemitter');

mongoose.connect('mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all remitters and check their structure
    const remitters = await DmtRemitter.find();
    console.log('Total remitters found:', remitters.length);
    
    if (remitters.length === 0) {
      console.log('No remitters found');
      return;
    }
    
    // Show remitter structure
    console.log('\n=== REMITTER STRUCTURE ===');
    remitters.forEach((remitter, index) => {
      console.log(`Remitter ${index + 1}:`);
      console.log('_id:', remitter._id);
      console.log('remitterId:', remitter.remitterId);
      console.log('mobile:', remitter.mobile);
      console.log('isVerified:', remitter.isVerified);
      console.log('Keys:', Object.keys(remitter.toObject()));
      console.log('---');
    });
    
    // Use the first remitter with a valid remitterId
    const validRemitter = remitters.find(r => r.remitterId) || remitters[0];
    const searchRemitterId = validRemitter.remitterId || validRemitter._id.toString();
    
    console.log('\nUsing remitterId for search:', searchRemitterId);
    
    // Get beneficiaries for this remitter
    const beneficiaries = await DmtBeneficiary.find({ 
      remitterId: searchRemitterId,
      isActive: true 
    });
    
    console.log('\n=== BENEFICIARIES STRUCTURE ===');
    console.log('Total beneficiaries found:', beneficiaries.length);
    
    beneficiaries.forEach((beneficiary, index) => {
      console.log(`\nBeneficiary ${index + 1}:`);
      console.log('_id:', beneficiary._id);
      console.log('_id type:', typeof beneficiary._id);
      console.log('_id toString():', beneficiary._id.toString());
      console.log('remitterId:', beneficiary.remitterId);
      console.log('accountHolderName:', beneficiary.accountHolderName);
      console.log('accountNumber:', beneficiary.accountNumber);
      console.log('isVerified:', beneficiary.isVerified);
      console.log('isActive:', beneficiary.isActive);
      console.log('Full object keys:', Object.keys(beneficiary.toObject()));
    });
    
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.disconnect();
  });