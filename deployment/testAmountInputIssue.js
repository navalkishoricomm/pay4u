const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const Wallet = require('./models/Wallet');

async function testAmountInputIssue() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find any user with remitter data
    const users = await User.find({}).limit(5);
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    // Find test user or any user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.findOne({ role: 'user' });
    }
    if (!testUser) {
      console.log('No user found');
      return;
    }
    console.log('Using user:', testUser.email);

    // Find any remitter
    const allRemitters = await DmtRemitter.find({}).limit(5);
    console.log(`Found ${allRemitters.length} remitters in database`);
    
    let remitter = await DmtRemitter.findOne({ userId: testUser._id });
    if (!remitter && allRemitters.length > 0) {
      remitter = allRemitters[0];
      // Find the user for this remitter
      testUser = await User.findById(remitter.userId);
      console.log(`Using remitter for user: ${testUser?.email}`);
    }
    
    if (!remitter) {
      console.log('No remitter found in database');
      return;
    }
    console.log('Remitter found:', {
      mobile: remitter.mobile,
      monthlyLimit: remitter.monthlyLimit,
      monthlyReceived: remitter.monthlyReceived,
      remainingLimit: remitter.getRemainingMonthlyLimit()
    });

    // Find beneficiaries
    const beneficiaries = await DmtBeneficiary.findByRemitter(remitter._id);
    console.log(`Found ${beneficiaries.length} beneficiaries`);
    
    beneficiaries.forEach((beneficiary, index) => {
      console.log(`Beneficiary ${index + 1}:`, {
        accountHolderName: beneficiary.accountHolderName,
        accountNumber: beneficiary.accountNumber,
        verificationStatus: beneficiary.verificationStatus,
        isVerified: beneficiary.verificationStatus === 'verified',
        isActive: beneficiary.isActive,
        monthlyLimit: beneficiary.monthlyLimit,
        monthlyReceived: beneficiary.monthlyReceived,
        remainingLimit: beneficiary.getRemainingMonthlyLimit()
      });
    });

    // Find wallet - prioritize wallet with highest balance for testing
    let wallet = null;
    let walletBalance = 0;
    
    if (testUser) {
      wallet = await Wallet.findOne({ userId: testUser._id });
      if (wallet) {
        walletBalance = wallet.balance;
        console.log(`Wallet balance for ${testUser.email}: ₹${walletBalance}`);
      } else {
        console.log(`No wallet found for user ${testUser.email}`);
      }
    }
    
    // If no wallet found for user or balance is 0, find wallet with highest balance
    if (!wallet || walletBalance === 0) {
      console.log('Finding wallet with highest balance for testing...');
      const allWallets = await Wallet.find({}).sort({ balance: -1 }).limit(5);
      console.log(`Found ${allWallets.length} wallets`);
      
      if (allWallets.length > 0) {
        wallet = allWallets[0];
        walletBalance = wallet.balance;
        
        // Get user info for this wallet
        const walletUser = await User.findById(wallet.userId);
        console.log(`Using wallet with highest balance: ₹${walletBalance} (User: ${walletUser ? walletUser.email : 'Unknown'})`);
        
        // Update testUser to match the wallet owner for consistency
        if (walletUser) {
          testUser = walletUser;
        }
      }
    }

    // Calculate max transfer amount for each beneficiary
    const verifiedBeneficiaries = beneficiaries.filter(b => b.verificationStatus === 'verified' && b.isActive);
    console.log(`\nVerified and active beneficiaries: ${verifiedBeneficiaries.length}`);
    
    verifiedBeneficiaries.forEach((beneficiary, index) => {
      const maxAmount = Math.min(
        beneficiary.getRemainingMonthlyLimit() || Infinity,
        remitter.getRemainingMonthlyLimit() || Infinity,
        walletBalance
      );
      
      console.log(`Max transfer amount for beneficiary ${index + 1} (${beneficiary.accountHolderName}): ₹${maxAmount}`);
      
      // Check if max amount is valid for input
      if (maxAmount === 0) {
        console.log('  ⚠️  Max amount is 0 - this could prevent input!');
      } else if (maxAmount === Infinity) {
        console.log('  ⚠️  Max amount is Infinity - this could cause issues!');
      } else if (maxAmount < 1) {
        console.log('  ⚠️  Max amount is less than 1 - this could prevent input!');
      } else {
        console.log('  ✅ Max amount looks valid');
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testAmountInputIssue();