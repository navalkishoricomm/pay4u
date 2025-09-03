const mongoose = require('mongoose');
const User = require('./models/User');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');

async function testFrontendInteraction() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find the test user and their remitter
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    const remitter = await DmtRemitter.findOne({ userId: user._id });
    
    console.log('\n=== FRONTEND INTERACTION TEST ===');
    console.log('User ID:', user._id);
    console.log('Remitter ID:', remitter._id);
    console.log('Remitter Mobile:', remitter.mobile);
    
    // Get beneficiaries for this remitter
    const beneficiaries = await DmtBeneficiary.find({
      remitterId: remitter._id,
      userId: user._id
    });
    
    console.log('\n=== BENEFICIARIES FOR FRONTEND ===');
    console.log('Number of beneficiaries:', beneficiaries.length);
    
    if (beneficiaries.length > 0) {
      const testBeneficiary = beneficiaries[0];
      console.log('\n=== TEST BENEFICIARY FOR FRONTEND ===');
      console.log('Beneficiary ID:', testBeneficiary._id);
      console.log('Account Holder:', testBeneficiary.accountHolderName);
      console.log('Account Number:', testBeneficiary.accountNumber);
      console.log('Verification Status:', testBeneficiary.verificationStatus);
      console.log('Is Active:', testBeneficiary.isActive);
      
      console.log('\n=== FRONTEND TESTING INSTRUCTIONS ===');
      console.log('1. Open the money transfer page: http://localhost:3000/money-transfer');
      console.log('2. Enter mobile number:', remitter.mobile);
      console.log('3. Click "Verify Mobile" button');
      console.log('4. You should see beneficiaries loaded');
      console.log('5. Click "Verify" or "Delete" button on beneficiary:', testBeneficiary.accountHolderName);
      console.log('6. Check browser console for debug logs');
      console.log('7. Check backend logs for API calls');
      
      console.log('\n=== EXPECTED CONSOLE LOGS ===');
      console.log('When clicking Verify button, you should see:');
      console.log('- "Verify button clicked for beneficiary:", beneficiary object');
      console.log('- "Beneficiary _id:", "' + testBeneficiary._id + '"');
      console.log('- "Beneficiary _id type:", "object"');
      
      console.log('\nWhen clicking Delete button, you should see:');
      console.log('- "Delete button clicked for beneficiary:", beneficiary object');
      console.log('- "Beneficiary _id:", "' + testBeneficiary._id + '"');
      console.log('- "Beneficiary _id type:", "object"');
      
      console.log('\n=== EXPECTED BACKEND API CALLS ===');
      console.log('For Verify: POST /api/dmt/beneficiary/' + testBeneficiary._id + '/verify');
      console.log('For Delete: DELETE /api/dmt/beneficiary/' + testBeneficiary._id);
      
      console.log('\n=== IF NO CONSOLE LOGS APPEAR ===');
      console.log('This could mean:');
      console.log('1. Beneficiaries are not rendering properly');
      console.log('2. Button click handlers are not attached');
      console.log('3. Console logs are being filtered out');
      console.log('4. JavaScript errors are preventing execution');
      
      console.log('\n✅ Test data is ready for frontend interaction testing');
    } else {
      console.log('❌ No beneficiaries found for testing');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testFrontendInteraction();