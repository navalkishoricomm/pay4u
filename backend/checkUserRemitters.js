const mongoose = require('mongoose');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const User = require('./models/User');
require('dotenv').config();

async function checkUserData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    console.log('Connected to MongoDB');
    
    // Find user by email
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('\n=== User Information ===');
    console.log('User ID:', user._id.toString());
    console.log('Email:', user.email);
    
    // Find remitters for this user
    const remitters = await DmtRemitter.find({ userId: user._id });
    console.log('\n=== User Remitters ===');
    console.log('Found', remitters.length, 'remitters');
    remitters.forEach((remitter, index) => {
      console.log(`Remitter ${index + 1}:`);
      console.log('  ID:', remitter._id.toString());
      console.log('  Mobile:', remitter.mobile);
      console.log('  Name:', remitter.firstName, remitter.lastName);
      console.log('  KYC Status:', remitter.kycStatus);
      console.log('  User ID:', remitter.userId.toString());
    });
    
    // Find beneficiaries for this user
    const beneficiaries = await DmtBeneficiary.find({ userId: user._id });
    console.log('\n=== User Beneficiaries ===');
    console.log('Found', beneficiaries.length, 'beneficiaries');
    beneficiaries.forEach((beneficiary, index) => {
      console.log(`Beneficiary ${index + 1}:`);
      console.log('  ID:', beneficiary._id.toString());
      console.log('  Account:', beneficiary.accountNumber);
      console.log('  Name:', beneficiary.accountHolderName);
      console.log('  IFSC:', beneficiary.ifscCode);
      console.log('  User ID:', beneficiary.userId.toString());
    });
    
    // Check wallet
    const userWithWallet = await User.findById(user._id).populate('wallet');
    console.log('\n=== User Wallet ===');
    if (userWithWallet.wallet) {
      console.log('Wallet ID:', userWithWallet.wallet._id);
      console.log('Balance:', userWithWallet.wallet.balance);
    } else {
      console.log('❌ No wallet found for user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkUserData();