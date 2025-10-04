const mongoose = require('mongoose');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Found user:', user.email, 'ID:', user._id);
    
    // Find remitter for this user
    const remitter = await DmtRemitter.findOne({ userId: user._id });
    if (!remitter) {
      console.log('No remitter found for user');
      return;
    }
    
    console.log('\n=== REMITTER INFO ===');
    console.log('Remitter ID:', remitter._id);
    console.log('Remitter remitterId:', remitter.remitterId);
    console.log('Mobile:', remitter.mobile);
    console.log('Is Verified:', remitter.isVerified);
    console.log('User ID:', remitter.userId);
    
    // Find beneficiaries using both _id and remitterId
    console.log('\n=== SEARCHING BENEFICIARIES ===');
    
    const beneficiariesByRemitterId = await DmtBeneficiary.find({ 
      remitterId: remitter._id,
      isActive: true 
    });
    
    const beneficiariesByRemitterIdString = await DmtBeneficiary.find({ 
      remitterId: remitter._id.toString(),
      isActive: true 
    });
    
    const beneficiariesByUserId = await DmtBeneficiary.find({ 
      userId: user._id,
      isActive: true 
    });
    
    console.log('Beneficiaries by remitterId (ObjectId):', beneficiariesByRemitterId.length);
    console.log('Beneficiaries by remitterId (String):', beneficiariesByRemitterIdString.length);
    console.log('Beneficiaries by userId:', beneficiariesByUserId.length);
    
    // Show the actual beneficiaries found
    const allBeneficiaries = [...beneficiariesByRemitterId, ...beneficiariesByRemitterIdString, ...beneficiariesByUserId];
    const uniqueBeneficiaries = allBeneficiaries.filter((beneficiary, index, self) => 
      index === self.findIndex(b => b._id.toString() === beneficiary._id.toString())
    );
    
    console.log('\n=== UNIQUE BENEFICIARIES ===');
    uniqueBeneficiaries.forEach((beneficiary, index) => {
      console.log(`\nBeneficiary ${index + 1}:`);
      console.log('_id:', beneficiary._id);
      console.log('remitterId:', beneficiary.remitterId);
      console.log('userId:', beneficiary.userId);
      console.log('accountHolderName:', beneficiary.accountHolderName);
      console.log('accountNumber:', beneficiary.accountNumber);
      console.log('verificationStatus:', beneficiary.verificationStatus);
      console.log('isActive:', beneficiary.isActive);
    });
    
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error:', error);
    mongoose.disconnect();
  });