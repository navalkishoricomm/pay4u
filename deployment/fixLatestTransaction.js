const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');
const User = require('./models/User');

async function fixLatestTransaction() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Find the specific transaction
        const transactionId = 'WLT-1757778340737-hxsqxiulc';
        const transaction = await Transaction.findOne({ transactionId });
        
        if (transaction) {
            console.log('\n=== Found Transaction ===');
            console.log('Transaction ID:', transaction.transactionId);
            console.log('Current Type:', transaction.type);
            console.log('Description:', transaction.description);
            
            // Check if it's a mobile recharge based on description
            if (transaction.description && transaction.description.includes('Mobile recharge')) {
                console.log('\n✅ This appears to be a mobile recharge transaction');
                console.log('Updating transaction type from "transfer" to "mobile-recharge"...');
                
                // Update the transaction type
                await Transaction.updateOne(
                    { transactionId: transactionId },
                    { 
                        $set: { 
                            type: 'mobile-recharge',
                            category: 'recharge'
                        }
                    }
                );
                
                console.log('✅ Transaction type updated successfully!');
                
                // Verify the update
                const updatedTransaction = await Transaction.findOne({ transactionId });
                console.log('New Type:', updatedTransaction.type);
                console.log('Category:', updatedTransaction.category);
            } else {
                console.log('❌ This does not appear to be a mobile recharge transaction');
            }
        } else {
            console.log('❌ Transaction not found:', transactionId);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixLatestTransaction();