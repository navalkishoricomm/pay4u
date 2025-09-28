const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

async function checkWallets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    
    console.log('🔍 Checking available wallets...');
    const wallets = await Wallet.find({}).limit(10);
    
    if (wallets.length === 0) {
      console.log('❌ No wallets found in database');
    } else {
      console.log(`✅ Found ${wallets.length} wallets:`);
      for (const wallet of wallets) {
        const user = await User.findById(wallet.userId);
        console.log(`- Wallet ID: ${wallet._id}`);
        console.log(`  User ID: ${wallet.userId}`);
        console.log(`  User: ${user ? user.name + ' (' + user.email + ')' : 'User not found'}`);
        console.log(`  Balance: ₹${wallet.balance}`);
        console.log(`  Status: ${wallet.status}`);
        console.log('---');
      }
    }
    
    // Also check users without wallets
    console.log('\n🔍 Checking users without wallets...');
    const users = await User.find({});
    for (const user of users) {
      const wallet = await Wallet.findOne({ userId: user._id });
      if (!wallet) {
        console.log(`- ${user.name} (${user.email}) - No wallet`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkWallets();