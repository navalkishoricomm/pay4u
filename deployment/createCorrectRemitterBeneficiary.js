const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const User = require('./models/User');
require('dotenv').config();

async function createCorrectRemitterBeneficiary() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    // Get the correct user ID from JWT token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mukgarg11@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const decoded = jwt.decode(token);
    const correctUserId = decoded.id;
    
    console.log('\n=== Creating for Correct User ===');
    console.log('Correct User ID from token:', correctUserId);
    
    // Find the user
    const user = await User.findById(correctUserId);
    console.log('User found:', user.email);
    
    // Check if remitter already exists for this user
    let remitter = await DmtRemitter.findOne({ userId: correctUserId });
    
    if (!remitter) {
      console.log('\n🔧 Creating remitter for correct user...');
      remitter = new DmtRemitter({
        userId: correctUserId,
        mobile: '9876543210',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Test Street, Test City',
        pincode: '110001',
        dateOfBirth: new Date('1990-01-01'),
        kycStatus: 'verified',
        monthlyLimit: 25000,
        monthlyUsed: 0
      });
      
      await remitter.save();
      console.log('✅ Remitter created:', remitter._id.toString());
    } else {
      console.log('✅ Remitter already exists:', remitter._id.toString());
    }
    
    // Check if beneficiary already exists for this remitter
    let beneficiary = await DmtBeneficiary.findOne({ remitterId: remitter._id, userId: correctUserId });
    
    if (!beneficiary) {
      console.log('\n🔧 Creating beneficiary for correct user...');
      beneficiary = new DmtBeneficiary({
        userId: correctUserId,
        remitterId: remitter._id,
        remitterMobile: remitter.mobile,
        accountNumber: '9876543210',
        ifscCode: 'SBIN0000123',
        accountHolderName: 'Jane Doe',
        bankName: 'State Bank of India',
        verificationStatus: 'verified',
        monthlyLimit: 500000,
        monthlyReceived: 0
      });
      
      await beneficiary.save();
      console.log('✅ Beneficiary created:', beneficiary._id.toString());
    } else {
      console.log('✅ Beneficiary already exists:', beneficiary._id.toString());
    }
    
    console.log('\n🎯 Use these IDs for testing:');
    console.log('User ID:', correctUserId);
    console.log('Remitter ID:', remitter._id.toString());
    console.log('Beneficiary ID:', beneficiary._id.toString());
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createCorrectRemitterBeneficiary();