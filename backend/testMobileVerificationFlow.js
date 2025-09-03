const mongoose = require('mongoose');
const User = require('./models/User');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');

async function testMobileVerificationFlow() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('\n=== USER FOUND ===');
    console.log('User ID:', user._id);
    console.log('Email:', user.email);

    // Find remitters that belong to this user
    console.log('\n=== FINDING REMITTERS FOR THIS USER ===');
    const userRemitters = await DmtRemitter.find({ userId: user._id });
    console.log('Number of remitters for this user:', userRemitters.length);
    
    if (userRemitters.length === 0) {
      console.log('No remitters found for this user');
      return;
    }
    
    // Use the first remitter found
    const remitter = userRemitters[0];
    console.log('\n=== USING REMITTER ===');
    console.log('Remitter _id:', remitter._id);
    console.log('Remitter remitterId:', remitter.remitterId);
    console.log('Remitter userId:', remitter.userId);
    console.log('Remitter mobile:', remitter.mobile);
    console.log('Remitter firstName:', remitter.firstName);
    console.log('Remitter lastName:', remitter.lastName);
    console.log('Remitter kycStatus:', remitter.kycStatus);
    
    // Simulate the response that would be sent to frontend
    const verifyMobileResponse = {
      success: true,
      remitter: {
        id: remitter._id,
        remitterId: remitter._id, // This is what frontend uses
        mobile: remitter.mobile,
        firstName: remitter.firstName,
        lastName: remitter.lastName,
        kycStatus: remitter.kycStatus,
        monthlyLimit: remitter.monthlyLimit,
        monthlyUsed: remitter.monthlyUsed,
        remainingLimit: remitter.monthlyLimit - remitter.monthlyUsed
      }
    };
    
    console.log('\n=== VERIFY MOBILE RESPONSE ===');
    console.log(JSON.stringify(verifyMobileResponse, null, 2));
    
    // Now test getBeneficiaries using the remitterId from response
    const frontendRemitterId = verifyMobileResponse.remitter.remitterId;
    console.log('\n=== TESTING GET BENEFICIARIES ===');
    console.log('Frontend will call getBeneficiaries with remitterId:', frontendRemitterId);
    
    // This simulates the backend API call: GET /api/dmt/remitter/:remitterId/beneficiaries
    const beneficiaries = await DmtBeneficiary.find({
      remitterId: frontendRemitterId,
      userId: user._id
    });
    
    console.log('\n=== BENEFICIARIES FOUND ===');
    console.log('Number of beneficiaries:', beneficiaries.length);
    
    if (beneficiaries.length > 0) {
      console.log('\n=== FIRST BENEFICIARY DETAILS ===');
      const firstBeneficiary = beneficiaries[0];
      console.log('_id:', firstBeneficiary._id);
      console.log('remitterId:', firstBeneficiary.remitterId);
      console.log('userId:', firstBeneficiary.userId);
      console.log('accountHolderName:', firstBeneficiary.accountHolderName);
      console.log('accountNumber:', firstBeneficiary.accountNumber);
      console.log('ifscCode:', firstBeneficiary.ifscCode);
      console.log('bankName:', firstBeneficiary.bankName);
      console.log('verificationStatus:', firstBeneficiary.verificationStatus);
      console.log('isActive:', firstBeneficiary.isActive);
      
      // Simulate the formatted response that would be sent to frontend
      const formattedBeneficiaries = beneficiaries.map(beneficiary => ({
        _id: beneficiary._id,
        id: beneficiary._id,
        accountNumber: beneficiary.accountNumber,
        ifscCode: beneficiary.ifscCode,
        accountHolderName: beneficiary.accountHolderName,
        bankName: beneficiary.bankName,
        mobile: beneficiary.mobile,
        verificationStatus: beneficiary.verificationStatus,
        isVerified: beneficiary.verificationStatus === 'verified',
        isActive: beneficiary.isActive,
        monthlyLimit: beneficiary.monthlyLimit,
        monthlyReceived: beneficiary.monthlyReceived,
        remainingLimit: beneficiary.monthlyLimit - beneficiary.monthlyReceived,
        createdAt: beneficiary.createdAt
      }));
      
      console.log('\n=== FORMATTED BENEFICIARIES RESPONSE ===');
      console.log('First formatted beneficiary:');
      console.log(JSON.stringify(formattedBeneficiaries[0], null, 2));
      
      // Test verification endpoint URL construction
      const testBeneficiaryId = formattedBeneficiaries[0]._id;
      console.log('\n=== VERIFICATION ENDPOINT TEST ===');
      console.log('Beneficiary ID for verification:', testBeneficiaryId);
      console.log('Verification URL would be: POST /api/dmt/beneficiary/' + testBeneficiaryId + '/verify');
      console.log('Delete URL would be: DELETE /api/dmt/beneficiary/' + testBeneficiaryId);
      
      // Verify the beneficiary ID is not undefined
      if (testBeneficiaryId && testBeneficiaryId !== 'undefined') {
        console.log('✅ Beneficiary ID is valid and not undefined');
        console.log('✅ Mobile verification flow test PASSED');
      } else {
        console.log('❌ Beneficiary ID is undefined or invalid');
        console.log('❌ Mobile verification flow test FAILED');
      }
    } else {
      console.log('No beneficiaries found for this remitter and user combination');
      
      // Let's also check if there are any beneficiaries for this user at all
      const allUserBeneficiaries = await DmtBeneficiary.find({ userId: user._id });
      console.log('Total beneficiaries for this user:', allUserBeneficiaries.length);
      
      if (allUserBeneficiaries.length > 0) {
        console.log('\n=== USER HAS BENEFICIARIES BUT NOT FOR THIS REMITTER ===');
        console.log('First beneficiary remitterId:', allUserBeneficiaries[0].remitterId);
        console.log('Current remitter _id:', remitter._id);
        console.log('Do they match?', allUserBeneficiaries[0].remitterId.toString() === remitter._id.toString());
      }
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testMobileVerificationFlow();