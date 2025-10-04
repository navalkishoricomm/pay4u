const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugRemitterLookup() {
  try {
    console.log('=== Debug Remitter Lookup ===');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mukgarg11@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const decoded = jwt.decode(token);
    const userIdFromToken = decoded.id;
    
    console.log('User ID from token:', userIdFromToken);
    
    // The IDs from testMoneyTransfer.js
    const remitterId = '68b5c1c2b192184e664375c8';
    const beneficiaryId = '68b5c26159765b3fa1982561';
    
    console.log('\n=== Checking Remitter ===');
    console.log('Looking for remitter with ID:', remitterId);
    console.log('And userId:', userIdFromToken);
    
    // Check remitter lookup exactly as in dmtController.js line 315
    const remitter = await DmtRemitter.findOne({ _id: remitterId, userId: userIdFromToken });
    console.log('Remitter found:', remitter ? 'YES' : 'NO');
    
    if (remitter) {
      console.log('Remitter details:', {
        _id: remitter._id,
        userId: remitter.userId,
        mobile: remitter.mobile,
        firstName: remitter.firstName
      });
    } else {
      // Check if remitter exists with different userId
      const remitterAnyUser = await DmtRemitter.findById(remitterId);
      if (remitterAnyUser) {
        console.log('Remitter exists but with different userId:', remitterAnyUser.userId);
        console.log('Expected userId:', userIdFromToken);
        console.log('Actual userId:', remitterAnyUser.userId);
      } else {
        console.log('Remitter does not exist at all with ID:', remitterId);
      }
    }
    
    console.log('\n=== Checking Beneficiary ===');
    console.log('Looking for beneficiary with ID:', beneficiaryId);
    console.log('And userId:', userIdFromToken);
    
    // Check beneficiary lookup exactly as in dmtController.js line 320
    const beneficiary = await DmtBeneficiary.findOne({ _id: beneficiaryId, userId: userIdFromToken });
    console.log('Beneficiary found:', beneficiary ? 'YES' : 'NO');
    
    if (beneficiary) {
      console.log('Beneficiary details:', {
        _id: beneficiary._id,
        userId: beneficiary.userId,
        accountNumber: beneficiary.accountNumber,
        name: beneficiary.name
      });
    } else {
      // Check if beneficiary exists with different userId
      const beneficiaryAnyUser = await DmtBeneficiary.findById(beneficiaryId);
      if (beneficiaryAnyUser) {
        console.log('Beneficiary exists but with different userId:', beneficiaryAnyUser.userId);
        console.log('Expected userId:', userIdFromToken);
        console.log('Actual userId:', beneficiaryAnyUser.userId);
      } else {
        console.log('Beneficiary does not exist at all with ID:', beneficiaryId);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log('Both remitter and beneficiary must be found for transaction to proceed.');
    console.log('Remitter lookup result:', remitter ? 'PASS' : 'FAIL');
    console.log('Beneficiary lookup result:', beneficiary ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugRemitterLookup();