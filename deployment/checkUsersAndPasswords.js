const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const bcrypt = require('bcryptjs');

require('dotenv').config();

async function checkUsersAndPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users:\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'No password set'}`);
      
      // Get wallet
      const wallet = await Wallet.findOne({ userId: user._id });
      console.log(`   Wallet Balance: ₹${wallet ? wallet.balance : 'No wallet'}`);
      
      // Test common passwords only if password exists
      if (user.password) {
        const testPasswords = ['password123', 'testpassword', '123456', 'password', 'admin123'];
        for (const testPassword of testPasswords) {
          const isMatch = await bcrypt.compare(testPassword, user.password);
          if (isMatch) {
            console.log(`   ✅ CORRECT PASSWORD: ${testPassword}`);
            break;
          }
        }
      }
      console.log('');
    }

    // Update wallet balance for test user if needed
    const testUser = await User.findOne({ email: 'testprod@pay4u.com' });
    if (testUser) {
      let wallet = await Wallet.findOne({ userId: testUser._id });
      if (!wallet) {
        wallet = new Wallet({
          userId: testUser._id,
          balance: 10000,
          transactions: []
        });
        await wallet.save();
        console.log('✅ Created wallet for test user with ₹10000');
      } else if (wallet.balance === 0) {
        wallet.balance = 10000;
        await wallet.save();
        console.log('✅ Added ₹10000 to test user wallet');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsersAndPasswords();