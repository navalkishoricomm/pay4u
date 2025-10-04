const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');
const User = require('./models/User');

async function checkNewTransaction() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Check the specific transaction
        const transactionId = 'WLT-1757778340737-hxsqxiulc';
        const transaction = await Transaction.findOne({ transactionId }).populate('userId', 'name email');
        
        if (transaction) {
            console.log('\n=== Transaction Details ===');
            console.log('Transaction ID:', transaction.transactionId);
            console.log('Type:', transaction.type);
            console.log('Status:', transaction.status);
            console.log('Amount:', transaction.amount);
            console.log('Description:', transaction.description);
            console.log('User:', transaction.userId ? transaction.userId.name : 'Unknown');
            console.log('Created At:', transaction.createdAt);
            
            if (transaction.rechargeDetails) {
                console.log('\n=== Recharge Details ===');
                console.log('Mobile Number:', transaction.rechargeDetails.mobileNumber);
                console.log('Operator:', transaction.rechargeDetails.operator);
                console.log('Service Type:', transaction.rechargeDetails.serviceType);
            }
        } else {
            console.log('Transaction not found:', transactionId);
        }
        
        // Check recent transactions to see pattern
        console.log('\n=== Recent Transactions (Last 5) ===');
        const recentTransactions = await Transaction.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name');
            
        recentTransactions.forEach(tx => {
            console.log(`${tx.transactionId} | Type: ${tx.type} | Amount: ${tx.amount} | Status: ${tx.status} | Desc: ${tx.description}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkNewTransaction();