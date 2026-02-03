const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const User = require('./models/User');

async function ensureWalletForUser(user, initialBalance = 10000) {
  let wallet = await Wallet.findOne({ user: user._id });
  if (!wallet) {
    console.log(`No wallet found for ${user.email}, creating one with balance ${initialBalance}...`);
    wallet = await Wallet.create({
      user: user._id,
      balance: initialBalance,
      currency: 'INR',
      isActive: true
    });
    console.log('Wallet created:', wallet._id);
  }
  return wallet;
}

async function testStatusUpdates() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u');
        console.log('Connected to MongoDB');
        
        // Allow passing email via CLI to test specific user, default to admin
        const emailArg = process.argv[2] || 'admin@pay4u.com';
        const adminUser = await User.findOne({ email: emailArg });
        if (!adminUser) {
            console.log(`User not found for email: ${emailArg}`);
            return;
        }
        
        console.log('Admin/User ID:', adminUser._id);
        
        // Ensure wallet exists
        const wallet = await ensureWalletForUser(adminUser);
        
        console.log('Admin/User Wallet ID:', wallet._id);
        
        // Fetch recent transactions for admin/user (same logic as the API)
        const statusUpdates = await Transaction.find({ 
            wallet: wallet._id 
        })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('_id transactionId userId status amount type description createdAt updatedAt notes')
        .lean();
        
        console.log('\n=== Recent Transactions ===');
        console.log(`Found ${statusUpdates.length} transactions`);
        
        statusUpdates.forEach((tx, index) => {
            console.log(`\n${index + 1}. Transaction ID: ${tx.transactionId}`);
            console.log(`   Type: ${tx.type}`);
            console.log(`   Status: ${tx.status}`);
            console.log(`   Amount: ₹${tx.amount}`);
            console.log(`   Description: ${tx.description}`);
            console.log(`   Created: ${tx.createdAt}`);
            console.log(`   Updated: ${tx.updatedAt}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

testStatusUpdates();