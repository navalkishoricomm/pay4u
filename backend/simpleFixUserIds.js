const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
require('dotenv').config();

async function simpleFixUserIds() {
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
    
    console.log('\n=== Fixing User IDs ===');
    console.log('Correct user ID from token:', correctUserId);
    
    // Update existing remitters
    const remitterIds = ['68b5c1c2b192184e664375c8'];
    for (const remitterId of remitterIds) {
      const result = await DmtRemitter.findByIdAndUpdate(
        remitterId,
        { userId: correctUserId },
        { new: true }
      );
      if (result) {
        console.log(`✅ Updated remitter ${remitterId} to user ${correctUserId}`);
      }
    }
    
    // Update existing beneficiaries
    const beneficiaryIds = ['68b5c26159765b3fa1982561'];
    for (const beneficiaryId of beneficiaryIds) {
      const result = await DmtBeneficiary.findByIdAndUpdate(
        beneficiaryId,
        { userId: correctUserId },
        { new: true }
      );
      if (result) {
        console.log(`✅ Updated beneficiary ${beneficiaryId} to user ${correctUserId}`);
      }
    }
    
    // Verify the updates
    console.log('\n=== Verification ===');
    const remitter = await DmtRemitter.findOne({ _id: remitterIds[0], userId: correctUserId });
    const beneficiary = await DmtBeneficiary.findOne({ _id: beneficiaryIds[0], userId: correctUserId });
    
    console.log('Remitter found with correct user ID:', !!remitter);
    console.log('Beneficiary found with correct user ID:', !!beneficiary);
    
    if (remitter && beneficiary) {
      console.log('\n🎯 Ready for testing:');
      console.log('User ID:', correctUserId);
      console.log('Remitter ID:', remitter._id.toString());
      console.log('Beneficiary ID:', beneficiary._id.toString());
    }
    
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

simpleFixUserIds();