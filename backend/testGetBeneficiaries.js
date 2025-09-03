const mongoose = require('mongoose');
const DmtRemitter = require('./models/DmtRemitter');
const dmtService = require('./services/dmtService');

mongoose.connect('mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find the remitter
    const remitter = await DmtRemitter.findOne({ mobile: '9810610554' });
    if (!remitter) {
      console.log('Remitter not found');
      return;
    }
    
    console.log('Found remitter:', remitter._id);
    
    try {
      const beneficiaries = await dmtService.getRemitterBeneficiaries(remitter._id);
      console.log('Beneficiaries from service:', beneficiaries.length);
      
      beneficiaries.forEach((ben, index) => {
        console.log(`Beneficiary ${index + 1}:`);
        console.log(`  _id: ${ben._id}`);
        console.log(`  accountHolderName: ${ben.accountHolderName}`);
        console.log(`  verificationStatus: ${ben.verificationStatus}`);
      });
    } catch (error) {
      console.error('Error from dmtService:', error);
    }
    
    mongoose.disconnect();
  })
  .catch(console.error);