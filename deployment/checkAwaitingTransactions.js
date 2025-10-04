const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get transactions awaiting approval
    const db = mongoose.connection.db;
    const awaitingTransactions = await db.collection('transactions')
      .find({ status: 'awaiting_approval' })
      .sort({ createdAt: -1 })
      .project({ transactionId: 1, type: 1, description: 1, amount: 1, status: 1, createdAt: 1 })
      .toArray();
    
    console.log('\nTransactions Awaiting Approval:');
    console.log('===============================');
    
    if (awaitingTransactions.length === 0) {
      console.log('No transactions awaiting approval found.');
    } else {
      awaitingTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. ID: ${tx.transactionId}`);
        console.log(`   Type: ${tx.type}`);
        console.log(`   Description: ${tx.description}`);
        console.log(`   Amount: Rs.${tx.amount}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Created: ${tx.createdAt}`);
        console.log('---');
      });
    }
    
    // Get pending mobile recharge transactions
    const pendingMobileRecharge = await db.collection('transactions')
      .find({ 
        type: 'mobile-recharge',
        status: { $in: ['pending', 'awaiting_approval'] }
      })
      .sort({ createdAt: -1 })
      .project({ transactionId: 1, type: 1, description: 1, amount: 1, status: 1, createdAt: 1 })
      .toArray();
    
    console.log('\nPending Mobile Recharge Transactions:');
    console.log('====================================');
    
    if (pendingMobileRecharge.length === 0) {
      console.log('No pending mobile recharge transactions found.');
    } else {
      pendingMobileRecharge.forEach((tx, index) => {
        console.log(`${index + 1}. ID: ${tx.transactionId}`);
        console.log(`   Type: ${tx.type}`);
        console.log(`   Description: ${tx.description}`);
        console.log(`   Amount: Rs.${tx.amount}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Created: ${tx.createdAt}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });