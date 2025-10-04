const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Update all pending mobile recharge transactions to awaiting_approval
    const db = mongoose.connection.db;
    
    // First, check current pending mobile recharge transactions
    const pendingCount = await db.collection('transactions').countDocuments({
      type: 'mobile-recharge',
      status: 'pending'
    });
    
    console.log(`Found ${pendingCount} pending mobile recharge transactions`);
    
    if (pendingCount > 0) {
      // Update them to awaiting_approval
      const result = await db.collection('transactions').updateMany(
        {
          type: 'mobile-recharge',
          status: 'pending'
        },
        {
          $set: {
            status: 'awaiting_approval',
            pendingReason: 'Awaiting manual approval',
            approvalTimeout: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours from now
          }
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} mobile recharge transactions to awaiting_approval status`);
    } else {
      console.log('No pending mobile recharge transactions to update');
    }
    
    // Verify the update
    const awaitingCount = await db.collection('transactions').countDocuments({
      type: 'mobile-recharge',
      status: 'awaiting_approval'
    });
    
    console.log(`Now there are ${awaitingCount} mobile recharge transactions awaiting approval`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });