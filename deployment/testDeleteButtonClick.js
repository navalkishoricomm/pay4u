const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');

async function testDeleteButtonClick() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find user and remitter
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    const remitter = await DmtRemitter.findOne({ userId: user._id });
    if (!remitter) {
      console.log('Remitter not found');
      return;
    }

    // Find beneficiaries using the same method as the API
    const beneficiariesBefore = await DmtBeneficiary.findByRemitter(remitter._id);
    console.log(`Found ${beneficiariesBefore.length} active beneficiaries before deletion`);
    
    if (beneficiariesBefore.length === 0) {
      console.log('No beneficiaries found to delete');
      return;
    }

    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mukgarg11@gmail.com',
      password: '12345678'
    });

    const token = loginResponse.data.token;
    console.log('Login successful');

    // Try to delete the first beneficiary
    const beneficiaryToDelete = beneficiariesBefore[0];
    console.log(`\nAttempting to delete beneficiary: ${beneficiaryToDelete.accountHolderName} (ID: ${beneficiaryToDelete._id})`);
    console.log(`Before deletion - isBlocked: ${beneficiaryToDelete.isBlocked}, isActive: ${beneficiaryToDelete.isActive}`);

    const deleteResponse = await axios.delete(
      `http://localhost:5000/api/dmt/beneficiary/${beneficiaryToDelete._id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Delete response status:', deleteResponse.status);
    console.log('Delete response data:', deleteResponse.data);

    // Check the beneficiary status in database after deletion
    const deletedBeneficiary = await DmtBeneficiary.findById(beneficiaryToDelete._id);
    console.log(`\nAfter deletion - isBlocked: ${deletedBeneficiary.isBlocked}, isActive: ${deletedBeneficiary.isActive}`);
    console.log(`Block reason: ${deletedBeneficiary.blockReason}`);

    // Verify deletion by checking active beneficiaries using the API method
    const beneficiariesAfter = await DmtBeneficiary.findByRemitter(remitter._id);
    console.log(`\nActive beneficiaries after deletion: ${beneficiariesAfter.length}`);
    
    if (beneficiariesAfter.length === beneficiariesBefore.length - 1) {
      console.log('✅ Delete operation successful! Beneficiary is now filtered out from active list.');
    } else {
      console.log('❌ Delete operation may have failed - beneficiary count unchanged');
    }

    // Also test the frontend API endpoint
    console.log('\n=== Testing Frontend API Endpoint ===');
    const frontendResponse = await axios.get(
      `http://localhost:5000/api/dmt/remitter/${remitter._id}/beneficiaries`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log(`Frontend API returned ${frontendResponse.data.beneficiaries.length} beneficiaries`);
    const deletedBeneficiaryInList = frontendResponse.data.beneficiaries.find(
      b => b._id === beneficiaryToDelete._id.toString()
    );
    
    if (!deletedBeneficiaryInList) {
      console.log('✅ Deleted beneficiary is correctly filtered out from frontend API');
    } else {
      console.log('❌ Deleted beneficiary still appears in frontend API');
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testDeleteButtonClick();