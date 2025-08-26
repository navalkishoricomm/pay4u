const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const Commission = require('./models/Commission');
require('dotenv').config();

async function testTransactionWithCommission() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find test user
    const user = await User.findOne({ email: 'mukgarg11@gmail.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      console.log('Test wallet not found');
      return;
    }

    console.log(`\n=== Testing Transaction with Commission ===`);
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Initial Wallet Balance: ₹${wallet.balance}`);

    // Test transaction data
    const transactionData = {
      type: 'mobile-recharge',
      amount: 100,
      metadata: {
        operator: 'Airtel',
        mobileNumber: '9876543210'
      }
    };

    console.log(`\nCreating transaction: ${transactionData.type} - ${transactionData.metadata.operator} - ₹${transactionData.amount}`);

    // Check if user has sufficient balance
    const requiredAmount = parseFloat(transactionData.amount);
    
    if (wallet.balance < requiredAmount) {
      console.log(`❌ INSUFFICIENT BALANCE: Current: ₹${wallet.balance}, Required: ₹${requiredAmount}`);
      return;
    }

    console.log(`✅ Balance sufficient: ₹${wallet.balance} >= ₹${requiredAmount}`);

    // Calculate commission
    const operator = transactionData.metadata.operator;
    const commission = await Commission.getCommissionRate(operator, transactionData.type);
    
    let commissionAmount = 0;
    let commissionType = 'none';
    let commissionRate = 0;
    
    if (commission) {
      commissionAmount = commission.calculateCommission(requiredAmount);
      commissionType = commission.commissionType;
      commissionRate = commission.commissionValue;
      console.log(`📊 Commission calculated: ₹${commissionAmount} (${commissionType}: ${commissionRate})`);
    } else {
      console.log(`📊 No commission structure found for ${operator} ${transactionData.type}`);
    }

    // Perform atomic balance deduction
    const updatedWallet = await Wallet.findOneAndUpdate(
      { 
        user: user._id, 
        balance: { $gte: requiredAmount }
      },
      { 
        $inc: { balance: -requiredAmount }
      },
      { 
        new: true,
        runValidators: true
      }
    );
    
    if (!updatedWallet) {
      console.log(`❌ RACE CONDITION: Insufficient balance during atomic update`);
      return;
    }

    console.log(`💰 Balance deducted atomically: -₹${requiredAmount}, New balance: ₹${updatedWallet.balance}`);

    // Create transaction description
    const description = `Mobile recharge for ${transactionData.metadata.mobileNumber}`;

    // Create transaction with commission details
    const transaction = new Transaction({
      wallet: wallet._id,
      type: transactionData.type,
      amount: requiredAmount,
      description,
      status: 'awaiting_approval',
      metadata: transactionData.metadata,
      paymentMethod: 'wallet',
      operator: operator,
      commissionAmount,
      commissionType,
      commissionRate,
    });

    await transaction.save();
    
    // Populate the transaction for display
    await transaction.populate('wallet', 'user balance');

    console.log(`\n📋 Transaction Created Successfully:`);
    console.log(`   ID: ${transaction._id}`);
    console.log(`   Type: ${transaction.type}`);
    console.log(`   Amount: ₹${transaction.amount}`);
    console.log(`   Operator: ${transaction.operator}`);
    console.log(`   Status: ${transaction.status}`);
    console.log(`   Commission: ₹${transaction.commissionAmount} (${transaction.commissionType}: ${transaction.commissionRate})`);
    console.log(`   Description: ${transaction.description}`);
    console.log(`   Created: ${transaction.createdAt}`);

    // Verify final wallet balance
    const finalWallet = await Wallet.findOne({ user: user._id });
    console.log(`\n💳 Final Wallet Balance: ₹${finalWallet.balance}`);

    // Show recent transactions with commission details
    console.log(`\n📊 Recent Transactions with Commission:`);
    const recentTransactions = await Transaction.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type amount status operator commissionAmount commissionType commissionRate createdAt');

    recentTransactions.forEach((txn, index) => {
      console.log(`${index + 1}. ${txn.type} - ₹${txn.amount} - ${txn.status}`);
      if (txn.operator) {
        console.log(`   Operator: ${txn.operator}`);
        console.log(`   Commission: ₹${txn.commissionAmount} (${txn.commissionType}: ${txn.commissionRate})`);
      }
      console.log(`   Date: ${txn.createdAt.toLocaleString()}`);
      console.log('');
    });

    console.log('=== Transaction with Commission Test Completed ===');

  } catch (error) {
    console.error('Error testing transaction with commission:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the test
testTransactionWithCommission();