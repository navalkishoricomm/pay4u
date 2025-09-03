const mongoose = require('mongoose');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const DmtRemitter = require('./models/DmtRemitter');
const User = require('./models/User');

async function testDeleteButton() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find the test user (mukgarg11@gmail.com)
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }
    console.log('Found user:', user.email, 'ID:', user._id);

    // Find remitter for this user
    const remitter = await DmtRemitter.findOne({ userId: user._id });
    if (!remitter) {
      console.log('No remitter found for this user');
      return;
    }
    console.log('Found remitter:', remitter.mobile, 'ID:', remitter._id);

    // Find beneficiaries for this remitter using _id (which is what the API expects)
    const beneficiaries = await DmtBeneficiary.find({ remitterId: remitter._id });
    console.log('Found beneficiaries for this remitter:', beneficiaries.length);
    
    if (beneficiaries.length > 0) {
      console.log('\nBeneficiaries for current user:');
      beneficiaries.forEach((ben, index) => {
        console.log(`Beneficiary ${index + 1}:`);
        console.log('  _id:', ben._id);
        console.log('  _id type:', typeof ben._id);
        console.log('  _id toString():', ben._id.toString());
        console.log('  remitterId:', ben.remitterId);
        console.log('  accountHolderName:', ben.accountHolderName);
        console.log('  accountNumber:', ben.accountNumber);
        console.log('  verificationStatus:', ben.verificationStatus);
        console.log('  ---');
      });
      
      // Test what the frontend API call would look like
      console.log('\n=== Frontend API Call Test ===');
      console.log('Frontend would call: GET /api/dmt/remitter/' + remitter._id + '/beneficiaries');
      console.log('Frontend would call DELETE: /api/dmt/beneficiary/' + beneficiaries[0]._id);
    } else {
      console.log('No beneficiaries found for this user. The delete button issue might be because there are no beneficiaries to delete.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDeleteButton();