const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

require('dotenv').config();

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({}).select('name mobile email role');
    console.log('\nAll Users in Database:');
    console.log('======================');
    
    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }

    for (const user of users) {
      console.log(`Name: ${user.name}`);
      console.log(`Mobile: ${user.mobile}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      
      // Check wallet for this user
      const wallet = await Wallet.findOne({ user: user._id });
      if (wallet) {
        console.log(`Wallet Balance: ₹${wallet.balance}`);
      } else {
        console.log('No wallet found');
      }
      console.log('---');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();