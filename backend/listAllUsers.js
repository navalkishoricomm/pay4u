const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function listAllUsers() {
  try {
    console.log('=== All Users in System ===');
    
    const users = await User.find({}).select('name email role createdAt');
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    
    console.log(`Found ${users.length} users:\n`);
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`${i + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      
      // Check wallet balance
      const wallet = await Wallet.findOne({ user: user._id });
      if (wallet) {
        console.log(`   💰 Wallet Balance: ₹${wallet.balance}`);
      } else {
        console.log(`   ❌ No wallet found`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

listAllUsers();