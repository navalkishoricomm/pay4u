const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const User = require('./models/User');
require('dotenv').config();

async function debugUserIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    // Test login to get token
    const axios = require('axios');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mukgarg11@gmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('\n=== Token Analysis ===');
    
    // Decode token to see user ID
    const decoded = jwt.decode(token);
    console.log('Token user ID:', decoded.id);
    
    // Find user in database
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    console.log('Database user ID:', user._id.toString());
    console.log('IDs match:', decoded.id === user._id.toString());
    
    // Check remitter ownership
    const remitterId = '68b5c1c2b192184e664375c8';
    const remitter = await DmtRemitter.findById(remitterId);
    console.log('\n=== Remitter Analysis ===');
    console.log('Remitter ID:', remitterId);
    console.log('Remitter userId:', remitter.userId.toString());
    console.log('Remitter belongs to token user:', remitter.userId.toString() === decoded.id);
    console.log('Remitter belongs to db user:', remitter.userId.toString() === user._id.toString());
    
    // Check beneficiary ownership
    const beneficiaryId = '68b5c26159765b3fa1982561';
    const beneficiary = await DmtBeneficiary.findById(beneficiaryId);
    console.log('\n=== Beneficiary Analysis ===');
    console.log('Beneficiary ID:', beneficiaryId);
    console.log('Beneficiary userId:', beneficiary.userId.toString());
    console.log('Beneficiary belongs to token user:', beneficiary.userId.toString() === decoded.id);
    console.log('Beneficiary belongs to db user:', beneficiary.userId.toString() === user._id.toString());
    
    // Test the exact query from dmtController
    const testRemitter = await DmtRemitter.findOne({ _id: remitterId, userId: decoded.id });
    const testBeneficiary = await DmtBeneficiary.findOne({ _id: beneficiaryId, userId: decoded.id });
    
    console.log('\n=== Controller Query Test ===');
    console.log('Remitter found with token userId:', !!testRemitter);
    console.log('Beneficiary found with token userId:', !!testBeneficiary);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

debugUserIds();