const mongoose = require('mongoose');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

async function testInsufficientBalance() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for insufficient balance test');

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

    // Test with an amount higher than current balance
    const testAmount = wallet.balance + 500; // Ensure insufficient balance
    console.log(`\n--- Testing ₹${testAmount} transaction with ₹${wallet.balance} balance ---`);

    console.log('Step 1: Initial balance check');
    if (wallet.balance < testAmount) {
      console.log('✓ Initial check: INSUFFICIENT BALANCE DETECTED');
    } else {
      console.log('✗ Initial check: Balance appears sufficient (unexpected)');
    }

    console.log('\nStep 2: Attempting atomic balance deduction');
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
      console.log('✓ Race condition protection is working!');
    } else {
      console.log('✗ ERROR: Atomic update succeeded when it should have failed!');
      console.log(`Unexpected new balance: ₹${updatedWallet.balance}`);
      
      // Rollback the erroneous transaction
      await Wallet.findOneAndUpdate(
        { user: user._id },
        { $inc: { balance: testAmount } }
      );
      console.log('Rolled back the erroneous transaction');
    }

    // Verify balance is unchanged
    const finalWallet = await Wallet.findOne({ user: user._id });
    console.log(`\nFinal wallet balance: ₹${finalWallet.balance}`);
    
    if (finalWallet.balance === wallet.balance) {
      console.log('✓ Balance remained unchanged - validation working correctly!');
    } else {
      console.log('✗ Balance changed unexpectedly!');
    }

  } catch (error) {
    console.error('Error during insufficient balance test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

testInsufficientBalance();