const mongoose = require('mongoose');
const dmtService = require('./services/dmtService');
const DmtRemitter = require('./models/DmtRemitter');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Find a test remitter
      const remitter = await DmtRemitter.findOne({ mobile: '9876543210' });
      if (!remitter) {
        console.log('No remitter found with mobile 9876543210');
        return;
      }
      
      console.log('Found remitter:', {
        _id: remitter._id,
        mobile: remitter.mobile,
        firstName: remitter.firstName
      });
      
      // Get beneficiaries using the service
      const beneficiaries = await dmtService.getRemitterBeneficiaries(remitter._id);
      console.log('\n=== Raw Service Response ===');
      console.log('Beneficiaries count:', beneficiaries.length);
      
      if (beneficiaries.length > 0) {
        console.log('\n=== First Beneficiary Raw Data ===');
        const firstBen = beneficiaries[0];
        console.log('Raw beneficiary object:', firstBen);
        console.log('_id:', firstBen._id);
        console.log('_id type:', typeof firstBen._id);
        console.log('verificationStatus:', firstBen.verificationStatus);
        console.log('isActive:', firstBen.isActive);
        
        // Test the controller formatting logic
        console.log('\n=== Controller Formatting Test ===');
        const formatted = {
          _id: firstBen._id.toString(),
          id: firstBen._id.toString(),
          accountNumber: firstBen.accountNumber,
          ifscCode: firstBen.ifscCode,
          accountHolderName: firstBen.accountHolderName,
          bankName: firstBen.bankName,
          mobile: firstBen.mobile,
          verificationStatus: firstBen.verificationStatus,
          isVerified: firstBen.verificationStatus === 'verified',
          isActive: firstBen.isActive,
          monthlyLimit: firstBen.monthlyLimit,
          monthlyReceived: firstBen.monthlyReceived,
          remainingLimit: firstBen.getRemainingMonthlyLimit ? firstBen.getRemainingMonthlyLimit() : 'N/A',
          createdAt: firstBen.createdAt
        };
        
        console.log('Formatted beneficiary:', formatted);
        console.log('Formatted _id:', formatted._id);
        console.log('Formatted isVerified:', formatted.isVerified);
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(console.error);