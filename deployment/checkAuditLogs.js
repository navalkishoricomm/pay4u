const mongoose = require('mongoose');
const TransactionAudit = require('./models/TransactionAudit');
require('dotenv').config();

async function checkAuditLogs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the latest 5 audit records
    const auditRecords = await TransactionAudit.find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    console.log('\n=== LATEST AUDIT RECORDS ===');
    console.log(`Found ${auditRecords.length} audit records`);
    
    auditRecords.forEach((record, index) => {
      console.log(`\n--- Record ${index + 1} ---`);
      console.log('Transaction ID:', record.transactionId);
      console.log('Transaction Type:', record.transactionType);
      console.log('User ID:', record.userId);
      console.log('User Mobile:', record.userMobile);
      console.log('IP Address:', record.ipAddress);
      console.log('Location:', JSON.stringify(record.location, null, 2));
      console.log('Timestamp:', record.timestamp);
      console.log('Risk Score:', record.riskScore);
    });

    // Check for duplicate transactions
    const duplicates = await TransactionAudit.aggregate([
      {
        $group: {
          _id: {
            transactionId: '$transactionId',
            userId: '$userId',
            transactionType: '$transactionType'
          },
          count: { $sum: 1 },
          records: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log('\n=== DUPLICATE TRANSACTIONS ===');
    console.log(`Found ${duplicates.length} duplicate transaction groups`);
    
    duplicates.forEach((dup, index) => {
      console.log(`\nDuplicate Group ${index + 1}:`);
      console.log('Transaction ID:', dup._id.transactionId);
      console.log('User ID:', dup._id.userId);
      console.log('Transaction Type:', dup._id.transactionType);
      console.log('Count:', dup.count);
    });

  } catch (error) {
    console.error('Error checking audit logs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkAuditLogs();