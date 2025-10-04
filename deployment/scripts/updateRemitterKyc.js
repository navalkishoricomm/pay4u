const mongoose = require('mongoose');
const DmtRemitter = require('../models/DmtRemitter');

async function updateRemitterKyc() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');
    
    // Find the test remitter
    const remitter = await DmtRemitter.findOne({ mobile: '9876543210' });
    
    if (!remitter) {
      console.log('❌ Test remitter not found');
      return;
    }
    
    console.log('Found remitter:', remitter.mobile);
    console.log('Current KYC status:', remitter.kycStatus);
    
    // Update KYC status to verified
    remitter.kycStatus = 'verified';
    remitter.kycType = 'otp'; // Set a valid KYC type
    await remitter.save();
    
    console.log('✅ Remitter KYC status updated to verified');
    console.log('Updated remitter:', {
      id: remitter._id,
      mobile: remitter.mobile,
      kycStatus: remitter.kycStatus,
      kycType: remitter.kycType
    });
    
  } catch (error) {
    console.error('❌ Error updating remitter KYC:', error);
  } finally {
    console.log('Disconnecting from MongoDB');
    await mongoose.disconnect();
  }
}

updateRemitterKyc();