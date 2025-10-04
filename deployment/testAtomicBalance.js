const mongoose = require('mongoose');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

async function testAtomicBalanceValidation() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for atomic balance test');

    // Find the test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    console.log(`Testing user: ${user.name} (${user.email})`);

    // Get current wallet
    let wallet = await Wallet.findOne({ user: user._id });
    console.log(`Current wallet balance: ₹${wallet.balance}`);

    // Test 1: Try to process a transaction with insufficient balance
    const testAmount = 1000;
    console.log(`\n--- Test 1: Attempting ₹${testAmount} transaction with ₹${wallet.balance} balance ---`);

    if (wallet.balance < testAmount) {
      console.log('✓ Initial balance check: INSUFFICIENT BALANCE DETECTED');
      
      // Try atomic update (this should fail)
      const updatedWallet = await Wallet.findOneAndUpdate(
        { 
          user: user._id, 
          balance: { $gte: testAmount } // Ensure balance is still sufficient
        },
        { 
          $inc: { balance: -testAmount } // Atomic decrement
        },
        { 
          new: true, // Return updated document
          runValidators: true
        }
      );
      
      if (!updatedWallet) {
        console.log('✓ Atomic update correctly FAILED - insufficient balance');
        console.log('✓ Balance validation is working correctly!');
      } else {
        console.log('✗ ERROR: Atomic update succeeded when it should have failed!');
        console.log(`New balance: ₹${updatedWallet.balance}`);
      }
    } else {
      console.log('⚠ Cannot test insufficient balance - user has sufficient funds');
    }

    // Test 2: Verify current balance is unchanged
    wallet = await Wallet.findOne({ user: user._id });
    console.log(`\nFinal wallet balance: ₹${wallet.balance}`);

    // Test 3: Show pending transactions
    const pendingTransactions = await Transaction.find({ 
      user: user._id, 
      status: 'awaiting_approval' 
    }).sort({ createdAt: -1 });
    
    console.log(`\nPending transactions: ${pendingTransactions.length}`);
    pendingTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type}: ₹${tx.amount} (${tx.createdAt.toISOString()})`);
    });

  } catch (error) {
    console.error('Error during atomic balance test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

testAtomicBalanceValidation();