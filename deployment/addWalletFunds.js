const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

require('dotenv').config();

async function addWalletFunds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find a user with low balance or create test funds
    const users = await User.find({ role: 'user' }).populate('wallet');
    
    console.log('\nUsers and their wallet balances:');
    for (const user of users) {
      const wallet = await Wallet.findOne({ user: user._id });
      console.log(`${user.name} (${user.email}): ₹${wallet ? wallet.balance : 'No wallet'}`);
    }

    // Find user with 0 balance or low balance
    let targetUser = await User.findOne({ email: 'testprod@pay4u.com' });
    if (!targetUser) {
      // Try to find any user with low balance
      const wallet = await Wallet.findOne().sort({ balance: 1 });
      if (wallet) {
        targetUser = await User.findById(wallet.user);
      }
    }

    if (!targetUser) {
      console.log('No suitable user found');
      return;
    }

    console.log(`\nAdding funds to user: ${targetUser.name} (${targetUser.email})`);

    // Find or create wallet
    let wallet = await Wallet.findOne({ user: targetUser._id });
    if (!wallet) {
      wallet = new Wallet({
        user: targetUser._id,
        balance: 0
      });
    }

    const currentBalance = wallet.balance;
    const addAmount = 10000; // Add ₹10,000 for testing
    
    wallet.balance = currentBalance + addAmount;
    await wallet.save();

    console.log(`✅ Wallet updated successfully!`);
    console.log(`Previous balance: ₹${currentBalance}`);
    console.log(`Added amount: ₹${addAmount}`);
    console.log(`New balance: ₹${wallet.balance}`);
    
    console.log(`\nYou can now test money transfer with this user:`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`Balance: ₹${wallet.balance}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addWalletFunds();