const mongoose = require('mongoose');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const User = require('./models/User');
require('dotenv').config();

async function checkRemitterOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    // Find the test user
    const testUser = await User.findOne({ email: 'mukgarg11@gmail.com' });
    console.log('\n=== Test User ===');
    console.log('User ID:', testUser._id.toString());
    console.log('Email:', testUser.email);
    
    // Find the existing remitter
    const existingRemitter = await DmtRemitter.findById('68b20bf861bf6eb0935d8b71');
    console.log('\n=== Existing Remitter ===');
    if (existingRemitter) {
      console.log('Remitter ID:', existingRemitter._id.toString());
      console.log('Mobile:', existingRemitter.mobile);
      console.log('Owner User ID:', existingRemitter.userId.toString());
      console.log('Belongs to test user:', existingRemitter.userId.toString() === testUser._id.toString());
    } else {
      console.log('❌ Remitter not found');
    }
    
    // Find all remitters for test user
    const userRemitters = await DmtRemitter.find({ userId: testUser._id });
    console.log('\n=== Test User Remitters ===');
    console.log('Found', userRemitters.length, 'remitters for test user');
    
    if (userRemitters.length === 0) {
      console.log('\n🔧 Creating new remitter for test user...');
      
      const newRemitter = new DmtRemitter({
        userId: testUser._id,
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
      
      await newRemitter.save();
      console.log('✅ New remitter created:', newRemitter._id.toString());
      
      // Create beneficiary for this remitter
      const newBeneficiary = new DmtBeneficiary({
        userId: testUser._id,
        remitterId: newRemitter._id,
        remitterMobile: '9876543210',
        accountNumber: '1234567890',
        ifscCode: 'SBIN0000123',
        accountHolderName: 'Jane Doe',
        bankName: 'State Bank of India',
        verificationStatus: 'verified',
        monthlyLimit: 500000,
        monthlyReceived: 0
      });
      
      await newBeneficiary.save();
      console.log('✅ New beneficiary created:', newBeneficiary._id.toString());
      
      console.log('\n🎯 Use these IDs for testing:');
      console.log('Remitter ID:', newRemitter._id.toString());
      console.log('Beneficiary ID:', newBeneficiary._id.toString());
    } else {
      userRemitters.forEach((remitter, index) => {
        console.log(`Remitter ${index + 1}:`);
        console.log('  ID:', remitter._id.toString());
        console.log('  Mobile:', remitter.mobile);
      });
      
      // Check beneficiaries for the first remitter
      const firstRemitter = userRemitters[0];
      const beneficiaries = await DmtBeneficiary.find({ remitterId: firstRemitter._id });
      console.log('\n=== Beneficiaries for Remitter ===');
      console.log('Found', beneficiaries.length, 'beneficiaries');
      
      if (beneficiaries.length === 0) {
        console.log('\n🔧 Creating beneficiary for existing remitter...');
        const newBeneficiary = new DmtBeneficiary({
          userId: testUser._id,
          remitterId: firstRemitter._id,
          remitterMobile: firstRemitter.mobile,
          accountNumber: '9876543210',
          ifscCode: 'SBIN0000123',
          accountHolderName: 'Jane Doe',
          bankName: 'State Bank of India',
          verificationStatus: 'verified',
          monthlyLimit: 500000,
          monthlyReceived: 0
        });
        
        await newBeneficiary.save();
        console.log('✅ New beneficiary created:', newBeneficiary._id.toString());
        
        console.log('\n🎯 Use these IDs for testing:');
        console.log('Remitter ID:', firstRemitter._id.toString());
        console.log('Beneficiary ID:', newBeneficiary._id.toString());
      } else {
        beneficiaries.forEach((beneficiary, index) => {
          console.log(`Beneficiary ${index + 1}:`);
          console.log('  ID:', beneficiary._id.toString());
          console.log('  Account:', beneficiary.accountNumber);
          console.log('  Holder:', beneficiary.accountHolderName);
        });
        
        console.log('\n🎯 Use these IDs for testing:');
        console.log('Remitter ID:', firstRemitter._id.toString());
        console.log('Beneficiary ID:', beneficiaries[0]._id.toString());
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkRemitterOwnership();