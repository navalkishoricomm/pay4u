const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const TransactionAudit = require('./models/TransactionAudit');

async function checkLatestTransaction() {
  try {
    console.log('=== Checking Latest Transaction ===');
    
    // Find the most recent transaction
    const latestTransaction = await TransactionAudit.findOne({
      transactionId: new mongoose.Types.ObjectId('68b836ec63b106143944f359')
    }).sort({ createdAt: -1 });
    
    if (latestTransaction) {
      console.log('\n--- Latest Test Transaction ---');
      console.log('Transaction ID:', latestTransaction.transactionId);
      console.log('Transaction Type:', latestTransaction.transactionType);
      console.log('User Mobile:', latestTransaction.userMobile);
      console.log('IP Address:', latestTransaction.ipAddress);
      console.log('Location:', JSON.stringify(latestTransaction.location, null, 2));
      console.log('Transaction Amount:', latestTransaction.transactionAmount);
      console.log('Transaction Status:', latestTransaction.transactionStatus);
      console.log('API Endpoint:', latestTransaction.apiEndpoint);
      console.log('Created At:', latestTransaction.createdAt);
    } else {
      console.log('Latest test transaction not found');
    }
    
    // Also check the very latest transaction in the database
    const veryLatest = await TransactionAudit.findOne().sort({ createdAt: -1 });
    
    if (veryLatest) {
      console.log('\n--- Very Latest Transaction in DB ---');
      console.log('Transaction ID:', veryLatest.transactionId);
      console.log('Transaction Type:', veryLatest.transactionType);
      console.log('User Mobile:', veryLatest.userMobile);
      console.log('IP Address:', veryLatest.ipAddress);
      console.log('Location:', JSON.stringify(veryLatest.location, null, 2));
      console.log('Transaction Amount:', veryLatest.transactionAmount);
      console.log('Transaction Status:', veryLatest.transactionStatus);
      console.log('API Endpoint:', veryLatest.apiEndpoint);
      console.log('Created At:', veryLatest.createdAt);
    }
    
  } catch (error) {
    console.error('Error checking latest transaction:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkLatestTransaction();