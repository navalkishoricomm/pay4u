const mongoose = require('mongoose');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

async function copyTestData() {
  try {
    console.log('Connecting to development database...');
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    
    // Get test data from development database
    const devUsers = await User.find({}).limit(2);
    const devRemitters = await DmtRemitter.find({}).limit(2);
    const devBeneficiaries = await DmtBeneficiary.find({ isActive: true, isBlocked: false }).limit(3);
    const devWallets = await Wallet.find({}).limit(2);
    
    console.log('Found in development database:');
    console.log('Users:', devUsers.length);
    console.log('Remitters:', devRemitters.length);
    console.log('Beneficiaries:', devBeneficiaries.length);
    console.log('Wallets:', devWallets.length);
    
    // Store the data
    const userData = devUsers.map(u => { const obj = u.toObject(); delete obj._id; return obj; });
    const remitterData = devRemitters.map(r => { const obj = r.toObject(); delete obj._id; return obj; });
    const beneficiaryData = devBeneficiaries.map(b => { const obj = b.toObject(); delete obj._id; return obj; });
    const walletData = devWallets.map(w => { const obj = w.toObject(); delete obj._id; return obj; });
    
    await mongoose.disconnect();
    
    console.log('\nConnecting to production database...');
    await mongoose.connect('mongodb://localhost:27017/pay4u_production');
    
    // Copy data to production database
    if (userData.length > 0) {
      await User.insertMany(userData, { ordered: false }).catch(err => {
        console.log('Some users may already exist, continuing...');
      });
    }
    
    if (remitterData.length > 0) {
      await DmtRemitter.insertMany(remitterData, { ordered: false }).catch(err => {
        console.log('Some remitters may already exist, continuing...');
      });
    }
    
    if (beneficiaryData.length > 0) {
      await DmtBeneficiary.insertMany(beneficiaryData, { ordered: false }).catch(err => {
        console.log('Some beneficiaries may already exist, continuing...');
      });
    }
    
    if (walletData.length > 0) {
      await Wallet.insertMany(walletData, { ordered: false }).catch(err => {
        console.log('Some wallets may already exist, continuing...');
      });
    }
    
    // Verify the data was copied
    const prodUsers = await User.countDocuments();
    const prodRemitters = await DmtRemitter.countDocuments();
    const prodBeneficiaries = await DmtBeneficiary.countDocuments({ isActive: true, isBlocked: false });
    const prodWallets = await Wallet.countDocuments();
    
    console.log('\n✅ Data copied to production database:');
    console.log('Users:', prodUsers);
    console.log('Remitters:', prodRemitters);
    console.log('Active Beneficiaries:', prodBeneficiaries);
    console.log('Wallets:', prodWallets);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

copyTestData();