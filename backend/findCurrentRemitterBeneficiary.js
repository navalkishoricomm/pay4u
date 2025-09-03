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

async function findCurrentRemitterBeneficiary() {
  try {
    console.log('=== Find Current Remitter & Beneficiary ===');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mukgarg11@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const decoded = jwt.decode(token);
    const userIdFromToken = decoded.id;
    
    console.log('User ID from token:', userIdFromToken);
    
    console.log('\n=== All Remitters for this user ===');
    const remitters = await DmtRemitter.find({ userId: userIdFromToken });
    console.log('Found', remitters.length, 'remitters');
    
    remitters.forEach((remitter, index) => {
      console.log(`Remitter ${index + 1}:`, {
        _id: remitter._id,
        mobile: remitter.mobile,
        firstName: remitter.firstName,
        lastName: remitter.lastName,
        userId: remitter.userId
      });
    });
    
    console.log('\n=== All Beneficiaries for this user ===');
    const beneficiaries = await DmtBeneficiary.find({ userId: userIdFromToken });
    console.log('Found', beneficiaries.length, 'beneficiaries');
    
    beneficiaries.forEach((beneficiary, index) => {
      console.log(`Beneficiary ${index + 1}:`, {
        _id: beneficiary._id,
        name: beneficiary.name,
        accountNumber: beneficiary.accountNumber,
        ifscCode: beneficiary.ifscCode,
        userId: beneficiary.userId
      });
    });
    
    if (remitters.length > 0 && beneficiaries.length > 0) {
      console.log('\n=== Updated IDs for testMoneyTransfer.js ===');
      console.log('remitterId:', remitters[0]._id.toString());
      console.log('beneficiaryId:', beneficiaries[0]._id.toString());
    } else {
      console.log('\n=== Need to create remitter and/or beneficiary ===');
      if (remitters.length === 0) {
        console.log('No remitters found for this user');
      }
      if (beneficiaries.length === 0) {
        console.log('No beneficiaries found for this user');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

findCurrentRemitterBeneficiary();