const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');
const DmtRemitter = require('./models/DmtRemitter');
const DmtBeneficiary = require('./models/DmtBeneficiary');
const Wallet = require('./models/Wallet');

require('dotenv').config();

async function testFrontendMaxAmount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find test user
    const testUser = await User.findOne({ email: 'testprod@pay4u.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Get wallet balance
    const wallet = await Wallet.findOne({ userId: testUser._id });
    const walletBalance = wallet ? wallet.balance : 0;
    
    console.log(`✅ Found test user: ${testUser.name} (Balance: ₹${walletBalance})`);

    // Login to get token - try different passwords
    console.log('\n🔐 Logging in...');
    let loginResponse;
    const passwords = ['password123', 'testpassword', '123456', 'password'];
    
    for (const password of passwords) {
      try {
        loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'testprod@pay4u.com',
          password: password
        });
        console.log(`✅ Login successful with password: ${password}`);
        break;
      } catch (error) {
        console.log(`❌ Failed with password: ${password}`);
        continue;
      }
    }

    if (!loginResponse || loginResponse.status !== 200) {
      console.log('❌ All login attempts failed');
      return;
    }

    const token = loginResponse.data.token;

    // Get remitter
    console.log('\n📱 Getting remitter...');
    const remitterResponse = await axios.get('http://localhost:5000/api/dmt/remitter/9643033686', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (remitterResponse.status !== 200) {
      console.log('❌ Failed to get remitter');
      return;
    }

    const remitter = remitterResponse.data.data.remitter;
    console.log(`✅ Found remitter: ${remitter.name} (ID: ${remitter._id})`);
    console.log(`   Monthly Limit: ₹${remitter.monthlyLimit}`);
    console.log(`   Monthly Sent: ₹${remitter.monthlySent}`);
    console.log(`   Remaining Limit: ₹${remitter.monthlyLimit - remitter.monthlySent}`);

    // Get beneficiaries
    console.log('\n👥 Getting beneficiaries...');
    const beneficiariesResponse = await axios.get(`http://localhost:5000/api/dmt/remitter/${remitter._id}/beneficiaries`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (beneficiariesResponse.status !== 200) {
      console.log('❌ Failed to get beneficiaries');
      return;
    }

    const beneficiaries = beneficiariesResponse.data.data.beneficiaries;
    console.log(`✅ Found ${beneficiaries.length} beneficiaries`);

    // Test each beneficiary
    for (const beneficiary of beneficiaries.slice(0, 3)) { // Test first 3
      console.log(`\n🏦 Testing beneficiary: ${beneficiary.accountHolderName}`);
      console.log(`   Account: ${beneficiary.accountNumber}`);
      console.log(`   Is Verified: ${beneficiary.isVerified}`);
      console.log(`   Monthly Limit: ₹${beneficiary.monthlyLimit}`);
      console.log(`   Monthly Received: ₹${beneficiary.monthlyReceived}`);
      console.log(`   Remaining Limit: ₹${beneficiary.remainingLimit}`);

      // Calculate max amount like frontend does
      const remitterRemainingLimit = remitter.monthlyLimit - remitter.monthlySent;
      const beneficiaryRemainingLimit = beneficiary.remainingLimit;

      const maxAmount = Math.min(
        walletBalance,
        remitterRemainingLimit,
        beneficiaryRemainingLimit
      );

      console.log(`\n💰 Max Transfer Calculation:`);
      console.log(`   Wallet Balance: ₹${walletBalance}`);
      console.log(`   Remitter Remaining: ₹${remitterRemainingLimit}`);
      console.log(`   Beneficiary Remaining: ₹${beneficiaryRemainingLimit}`);
      console.log(`   🎯 MAXIMUM TRANSFER AMOUNT: ₹${maxAmount}`);

      if (maxAmount > 0) {
        console.log('   ✅ Transfer should be possible!');
      } else {
        console.log('   ❌ Transfer not possible - max amount is 0');
      }
    }

    console.log('\n🎉 Frontend max amount test completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
  }
}

testFrontendMaxAmount();