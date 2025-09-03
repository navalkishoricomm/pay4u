const mongoose = require('mongoose');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const dmtService = require('./services/dmtService');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find a beneficiary to test with
      const beneficiary = await DmtBeneficiary.findOne({ isActive: true });
      
      if (!beneficiary) {
        console.log('No active beneficiaries found');
        return;
      }
      
      console.log('Testing with beneficiary:');
      console.log('ID:', beneficiary._id.toString());
      console.log('Account Holder:', beneficiary.accountHolderName);
      console.log('Account Number:', beneficiary.accountNumber);
      console.log('Verification Status:', beneficiary.verificationStatus);
      console.log('Is Active:', beneficiary.isActive);
      console.log('Is Blocked:', beneficiary.isBlocked);
      
      // Test verification
      console.log('\n=== Testing Beneficiary Verification ===');
      try {
        const verifyResult = await dmtService.verifyBeneficiary(beneficiary._id.toString());
        console.log('Verification result:', verifyResult);
      } catch (error) {
        console.log('Verification error:', error.message);
      }
      
      // Test deletion (commented out to avoid actually deleting)
      console.log('\n=== Testing Beneficiary Deletion (DRY RUN) ===');
      console.log('Would delete beneficiary with ID:', beneficiary._id.toString());
      // Uncomment the lines below to actually test deletion
      /*
      try {
        const deleteResult = await dmtService.deleteBeneficiary(beneficiary._id.toString());
        console.log('Deletion result:', deleteResult);
      } catch (error) {
        console.log('Deletion error:', error.message);
      }
      */
      
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(console.error);