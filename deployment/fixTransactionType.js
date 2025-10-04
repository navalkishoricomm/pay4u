const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

require('dotenv').config();

async function fixTransactionType() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const transactionId = 'WLT-1757777783208-yqv3pf9fb';
    
    // Find the specific transaction
    const transaction = await Transaction.findOne({ transactionId });
    
    if (transaction) {
      console.log('\n=== CURRENT TRANSACTION ===');
      console.log('Transaction ID:', transaction.transactionId);
      console.log('Current Type:', transaction.type);
      console.log('Description:', transaction.description);
      console.log('Recharge Data:', transaction.rechargeData);
      
      // Check if this looks like a mobile recharge based on description
      if (transaction.description && transaction.description.includes('Mobile recharge')) {
        console.log('\n✅ This appears to be a mobile recharge transaction');
        console.log('Updating transaction type from "transfer" to "mobile-recharge"...');
        
        // Update the transaction type
        const result = await Transaction.updateOne(
          { transactionId },
          { 
            $set: { 
              type: 'mobile-recharge',
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log('✅ Transaction type updated successfully!');
          
          // Verify the update
          const updatedTransaction = await Transaction.findOne({ transactionId });
          console.log('New Type:', updatedTransaction.type);
        } else {
          console.log('❌ Failed to update transaction type');
        }
      } else {
        console.log('\n❌ This does not appear to be a mobile recharge transaction');
        console.log('Description does not match expected pattern');
      }
    } else {
      console.log('\n❌ TRANSACTION NOT FOUND');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixTransactionType();