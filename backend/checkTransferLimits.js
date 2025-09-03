const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');

require('dotenv').config();

async function checkTransferLimits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find users with wallets
    const users = await User.find({ role: 'user' });
    
    for (const user of users) {
      console.log(`\n=== User: ${user.name} (${user.email}) ===`);
      
      // Check wallet
      const wallet = await Wallet.findOne({ user: user._id });
      console.log(`Wallet Balance: ₹${wallet ? wallet.balance : 'No wallet'}`);
      
      // Check remitter
      const remitter = await DmtRemitter.findOne({ userId: user._id });
      if (remitter) {
        console.log(`Remitter Mobile: ${remitter.mobile}`);
        console.log(`Remitter Monthly Limit: ₹${remitter.monthlyLimit || 'Not set'}`);
        console.log(`Remitter Remaining Limit: ₹${remitter.remainingLimit || 'Not set'}`);
        console.log(`Remitter KYC Status: ${remitter.kycStatus}`);
        
        // Check beneficiaries
        const beneficiaries = await DmtBeneficiary.find({ 
          remitterId: remitter._id,
          isActive: true 
        });
        
        console.log(`\nBeneficiaries (${beneficiaries.length}):`);
        beneficiaries.forEach((ben, index) => {
          console.log(`  ${index + 1}. ${ben.accountHolderName}`);
          console.log(`     Account: ${ben.accountNumber}`);
          console.log(`     Verified: ${ben.isVerified}`);
          console.log(`     Monthly Limit: ₹${ben.monthlyLimit || 'Not set'}`);
          console.log(`     Remaining Limit: ₹${ben.remainingLimit || 'Not set'}`);
          console.log(`     Remaining Limit (raw): ${ben.remainingLimit}`);
          console.log(`     Remaining Limit (type): ${typeof ben.remainingLimit}`);
          
          // Calculate effective max amount
          const walletBalance = wallet ? wallet.balance : 0;
          const remitterLimit = remitter.remainingLimit || Infinity;
          const beneficiaryLimit = ben.remainingLimit || Infinity;
          
          const maxAmount = Math.min(walletBalance, remitterLimit, beneficiaryLimit);
          console.log(`     Effective Max Transfer: ₹${maxAmount === Infinity ? 'Unlimited' : maxAmount}`);
          console.log('');
        });
      } else {
        console.log('No remitter found for this user');
      }
      
      console.log('---');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkTransferLimits();