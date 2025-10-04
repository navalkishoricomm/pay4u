const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traepay4u');
    
    console.log('🔍 Checking available users...');
    const users = await User.find({}).limit(5);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${users.length} users:`);
      for (const user of users) {
        const wallet = await Wallet.findOne({ userId: user._id });
        console.log(`- ${user.name} (${user.email}) - Wallet: ${wallet ? '₹' + wallet.balance : 'Not found'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUsers();