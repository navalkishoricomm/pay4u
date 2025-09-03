require('dotenv').config();
const mongoose = require('mongoose');
const Wallet = require('./models/Wallet');

async function checkWalletFields() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Check raw wallet documents
    const rawWallets = await mongoose.connection.db.collection('wallets').find({}).limit(5).toArray();
    console.log('\nRaw wallet documents:');
    rawWallets.forEach((wallet, index) => {
      console.log(`Wallet ${index + 1}:`, {
        id: wallet._id,
        user: wallet.user,
        userId: wallet.userId,
        balance: wallet.balance
      });
    });
    
    // Check using Mongoose model
    const wallets = await Wallet.find({}).limit(5);
    console.log('\nWallets via Mongoose model:');
    wallets.forEach((wallet, index) => {
      console.log(`Wallet ${index + 1}:`, {
        id: wallet._id,
        user: wallet.user,
        userId: wallet.userId,
        balance: wallet.balance
      });
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkWalletFields();