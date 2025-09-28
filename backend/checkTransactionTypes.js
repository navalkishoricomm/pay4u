const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get recent transactions directly from the collection
    const db = mongoose.connection.db;
    const transactions = await db.collection('transactions')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .project({ transactionId: 1, type: 1, description: 1, amount: 1, status: 1, createdAt: 1 })
      .toArray();
    
    console.log('\nRecent Transactions:');
    console.log('===================');
    
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ID: ${tx.transactionId}`);
      console.log(`   Type: ${tx.type}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Amount: Rs.${tx.amount}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Created: ${tx.createdAt}`);
      console.log('---');
    });
    
    // Count transactions by type
    const typeStats = await db.collection('transactions').aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    console.log('\nTransaction Types Summary:');
    console.log('=========================');
    typeStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} transactions`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });