const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const User = require('./models/User');

async function testStatusUpdates() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Find admin user
        const adminUser = await User.findOne({ email: 'admin@pay4u.com' });
        if (!adminUser) {
            console.log('Admin user not found');
            return;
        }
        
        console.log('Admin User ID:', adminUser._id);
        
        // Find admin's wallet
        const wallet = await Wallet.findOne({ user: adminUser._id });
        if (!wallet) {
            console.log('Admin wallet not found');
            return;
        }
        
        console.log('Admin Wallet ID:', wallet._id);
        
        // Fetch recent transactions for admin (same logic as the API)
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