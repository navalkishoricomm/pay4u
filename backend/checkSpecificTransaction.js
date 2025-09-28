const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

require('dotenv').config();

async function checkSpecificTransaction() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const transactionId = 'WLT-1757777783208-yqv3pf9fb';
    
    // Find the specific transaction
    const transaction = await Transaction.findOne({ transactionId });
    
    if (transaction) {
      console.log('\n=== TRANSACTION FOUND ===');
      console.log('Transaction ID:', transaction.transactionId);
      console.log('User ID:', transaction.userId);
      console.log('Type:', transaction.type);
      console.log('Status:', transaction.status);
      console.log('Amount:', transaction.amount);
      console.log('Service Type:', transaction.serviceType);
      console.log('Created At:', transaction.createdAt);
      console.log('Updated At:', transaction.updatedAt);
      console.log('Full Transaction:', JSON.stringify(transaction, null, 2));
    } else {
      console.log('\n❌ TRANSACTION NOT FOUND');
      console.log('Transaction ID searched:', transactionId);
      
      // Search for similar transactions
      const similarTransactions = await Transaction.find({
        transactionId: { $regex: 'WLT-1757777783208', $options: 'i' }
      });
      
      console.log('\n=== SIMILAR TRANSACTIONS ===');
      console.log('Found', similarTransactions.length, 'similar transactions');
      similarTransactions.forEach(tx => {
        console.log(`- ${tx.transactionId} | ${tx.status} | ${tx.type} | ₹${tx.amount}`);
      });
    }
    
    // Also check all pending recharge transactions
    const pendingRecharges = await Transaction.find({
      type: 'recharge',
      status: 'pending'
    }).sort({ createdAt: -1 }).limit(10);
    
    console.log('\n=== RECENT PENDING RECHARGES ===');
    console.log('Found', pendingRecharges.length, 'pending recharge transactions');
    pendingRecharges.forEach(tx => {
      console.log(`- ${tx.transactionId} | ${tx.status} | ₹${tx.amount} | ${tx.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSpecificTransaction();