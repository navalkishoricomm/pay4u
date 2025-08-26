const mongoose = require('mongoose');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

// Simulate the exact logic from transactionController.js
async function simulateTransactionRequest(userId, type, amount, phoneNumber) {
  try {
    console.log(`\n=== Simulating ${type} transaction ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Amount: ₹${amount}`);
    console.log(`Phone: ${phoneNumber}`);

    // Step 1: Find user wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return { success: false, message: 'Wallet not found' };
    }

    console.log(`Current wallet balance: ₹${wallet.balance}`);

    // Step 2: Balance validation for recharge/bill payment transactions
    if (['mobile-recharge', 'dth-recharge', 'bill-payment'].includes(type)) {
      console.log(`Balance validation: Current balance: ₹${wallet.balance}, Required: ₹${amount}`);
      
      const requiredAmount = parseFloat(amount);
      
      if (wallet.balance < requiredAmount) {
        console.log(`INSUFFICIENT BALANCE DETECTED: ${wallet.balance} < ${requiredAmount}`);
        return {
          success: false,
          message: `Insufficient wallet balance. Current balance: ₹${wallet.balance.toFixed(2)}, Required: ₹${requiredAmount.toFixed(2)}`
        };
      }
      
      console.log(`Balance sufficient, proceeding with atomic deduction`);
      
      // Step 3: Use atomic operation to prevent race conditions
      const updatedWallet = await Wallet.findOneAndUpdate(
        { 
          user: userId, 
          balance: { $gte: requiredAmount } // Ensure balance is still sufficient
        },
        { 
          $inc: { balance: -requiredAmount } // Atomic decrement
        },
        { 
          new: true, // Return updated document
          runValidators: true
        }
      );
      
      if (!updatedWallet) {
        console.log(`RACE CONDITION DETECTED: Insufficient balance during atomic update`);
        return {
          success: false,
          message: `Insufficient wallet balance. Please try again.`
        };
      }
      
      console.log(`Wallet balance deducted atomically: -${requiredAmount}, New balance: ${updatedWallet.balance}`);
      
      // Update the wallet object for further use
      wallet.balance = updatedWallet.balance;
    }

    // Step 4: Create transaction record
    const transaction = new Transaction({
      wallet: wallet._id,
      type: type,
      amount: parseFloat(amount),
      status: 'awaiting_approval',
      description: `${type} for ${phoneNumber}`,
      metadata: { phoneNumber: phoneNumber },
      reference: `${type.toUpperCase()}-${Date.now()}`
    });

    await transaction.save();
    console.log(`Transaction created: ${transaction._id}`);
    console.log(`Transaction status: ${transaction.status}`);

    return {
      success: true,
      message: 'Transaction processed successfully',
      transactionId: transaction._id,
      newBalance: wallet.balance
    };

  } catch (error) {
    console.error('Error during transaction simulation:', error);
    return { success: false, message: error.message };
  }
}

async function testRealTransactionFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for real transaction test');

    // Find the test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    console.log(`Testing user: ${user.name} (${user.email})`);

    // Get initial wallet balance
    const initialWallet = await Wallet.findOne({ user: user._id });
    console.log(`Initial wallet balance: ₹${initialWallet.balance}`);

    // Test 1: Valid transaction (should succeed)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Valid transaction (amount < balance)');
    console.log('='.repeat(60));
    
    const validAmount = Math.min(100, initialWallet.balance - 100); // Ensure it's less than balance
    const result1 = await simulateTransactionRequest(
      user._id,
      'mobile-recharge',
      validAmount,
      '9876543210'
    );
    
    console.log('\nResult 1:');
    console.log(`Success: ${result1.success}`);
    console.log(`Message: ${result1.message}`);
    if (result1.success) {
      console.log(`New balance: ₹${result1.newBalance}`);
      console.log(`Transaction ID: ${result1.transactionId}`);
    }

    // Test 2: Invalid transaction (should fail)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Invalid transaction (amount > balance)');
    console.log('='.repeat(60));
    
    const currentWallet = await Wallet.findOne({ user: user._id });
    const invalidAmount = currentWallet.balance + 500; // Ensure it's more than balance
    
    const result2 = await simulateTransactionRequest(
      user._id,
      'mobile-recharge',
      invalidAmount,
      '9876543210'
    );
    
    console.log('\nResult 2:');
    console.log(`Success: ${result2.success}`);
    console.log(`Message: ${result2.message}`);

    // Verify final balance
    const finalWallet = await Wallet.findOne({ user: user._id });
    console.log(`\nFinal wallet balance: ₹${finalWallet.balance}`);
    
    // Show recent transactions
    const recentTransactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(3);
    
    console.log('\nRecent transactions:');
    recentTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type}: ₹${tx.amount} (${tx.status}) - ${tx.createdAt.toISOString()}`);
    });

  } catch (error) {
    console.error('Error during real transaction test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

testRealTransactionFlow();