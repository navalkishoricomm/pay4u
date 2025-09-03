const mongoose = require('mongoose');
const RechargeTransaction = require('../models/RechargeTransaction');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateRechargeTransactions = async () => {
  try {
    console.log('Starting RechargeTransaction migration...');
    
    // Get all RechargeTransaction records
    const rechargeTransactions = await RechargeTransaction.find({}).lean();
    console.log(`Found ${rechargeTransactions.length} RechargeTransaction records to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const rechargeTransaction of rechargeTransactions) {
      try {
        // Check if transaction already exists in unified Transaction model
        const existingTransaction = await Transaction.findOne({
          transactionId: rechargeTransaction.transactionId
        });
        
        if (existingTransaction) {
          console.log(`Skipping duplicate transaction: ${rechargeTransaction.transactionId}`);
          skippedCount++;
          continue;
        }
        
        // Get user's wallet
        const user = await User.findById(rechargeTransaction.userId);
        if (!user) {
          console.log(`User not found for transaction: ${rechargeTransaction.transactionId}`);
          errorCount++;
          continue;
        }
        
        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) {
          console.log(`Wallet not found for user: ${user._id}`);
          errorCount++;
          continue;
        }
        
        // Map RechargeTransaction to unified Transaction model
        const transactionData = {
          wallet: wallet._id,
          userId: user._id,
          amount: rechargeTransaction.amount,
          type: rechargeTransaction.type === 'mobile' ? 'mobile-recharge' : 'dth-recharge',
          status: rechargeTransaction.status,
          description: `${rechargeTransaction.type.toUpperCase()} Recharge - ${rechargeTransaction.operator}`,
          transactionId: rechargeTransaction.transactionId,
          reference: rechargeTransaction.transactionId,
          operator: rechargeTransaction.operator,
          
          // Recharge-specific data
          rechargeData: {
            mobileNumber: rechargeTransaction.mobileNumber,
            customerNumber: rechargeTransaction.customerNumber,
            circle: rechargeTransaction.circle,
            planId: rechargeTransaction.planId,
            planName: rechargeTransaction.planName,
            planDescription: rechargeTransaction.planDescription,
            validity: rechargeTransaction.validity,
            talktime: rechargeTransaction.talktime,
            data: rechargeTransaction.data
          },
          
          // API and external references
          apiTransactionId: rechargeTransaction.apiTransactionId,
          apiProvider: rechargeTransaction.apiProvider || 'manual',
          apiResponse: rechargeTransaction.apiResponse,
          
          // Status and timing
          initiatedAt: rechargeTransaction.createdAt,
          completedAt: rechargeTransaction.completedAt,
          
          // Error handling
          failureReason: rechargeTransaction.failureReason,
          
          // Refund information
          refundAmount: rechargeTransaction.refundAmount,
          refundedAt: rechargeTransaction.refundedAt,
          
          // Metadata
          metadata: {
            ...rechargeTransaction.metadata,
            migratedFrom: 'RechargeTransaction',
            originalId: rechargeTransaction._id
          },
          
          // Timestamps
          createdAt: rechargeTransaction.createdAt,
          updatedAt: rechargeTransaction.updatedAt
        };
        
        // Remove undefined fields
        Object.keys(transactionData).forEach(key => {
          if (transactionData[key] === undefined) {
            delete transactionData[key];
          }
        });
        
        // Remove undefined fields from rechargeData
        Object.keys(transactionData.rechargeData).forEach(key => {
          if (transactionData.rechargeData[key] === undefined) {
            delete transactionData.rechargeData[key];
          }
        });
        
        // Create new Transaction record
        const newTransaction = new Transaction(transactionData);
        await newTransaction.save();
        
        migratedCount++;
        console.log(`Migrated transaction: ${rechargeTransaction.transactionId} (${migratedCount}/${rechargeTransactions.length})`);
        
      } catch (error) {
        console.error(`Error migrating transaction ${rechargeTransaction.transactionId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total records found: ${rechargeTransactions.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (duplicates): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errorCount === 0 && migratedCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n⚠️  IMPORTANT: After verifying the migrated data, you can safely remove the RechargeTransaction model and collection.');
      console.log('   To remove the collection, run: db.rechargetransactions.drop()');
    } else if (errorCount > 0) {
      console.log('\n⚠️  Migration completed with errors. Please review the error messages above.');
    } else {
      console.log('\n✅ No new records to migrate.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run migration
migrateRechargeTransactions();