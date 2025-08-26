const mongoose = require('mongoose');
const Commission = require('./models/Commission');
const Transaction = require('./models/Transaction');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

async function testCommissionSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u');
    console.log('Connected to MongoDB');

    // Find a test user
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

    console.log(`\n=== Testing Commission System ===`);
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Current Wallet Balance: ₹${wallet.balance}`);

    // Test 1: Create sample commission structures
    console.log('\n--- Creating Sample Commission Structures ---');
    
    const commissionStructures = [
      {
        operator: 'Airtel',
        transactionType: 'mobile-recharge',
        commissionType: 'percentage',
        commissionValue: 2.5, // 2.5%
        minCommission: 1,
        maxCommission: 10,
        description: 'Airtel mobile recharge commission',
        createdBy: user._id
      },
      {
        operator: 'Jio',
        transactionType: 'mobile-recharge',
        commissionType: 'fixed',
        commissionValue: 5, // Fixed ₹5
        minCommission: 0,
        maxCommission: null,
        description: 'Jio mobile recharge fixed commission',
        createdBy: user._id
      },
      {
        operator: 'Tata Sky',
        transactionType: 'dth-recharge',
        commissionType: 'percentage',
        commissionValue: 1.5, // 1.5%
        minCommission: 2,
        maxCommission: 15,
        description: 'Tata Sky DTH recharge commission',
        createdBy: user._id
      },
      {
        operator: 'BSNL',
        transactionType: 'bill-payment',
        commissionType: 'percentage',
        commissionValue: 3.0, // 3.0%
        minCommission: 0,
        maxCommission: 20,
        description: 'BSNL bill payment commission',
        createdBy: user._id
      }
    ];

    // Clear existing commission structures for clean testing
    await Commission.deleteMany({});
    
    for (const structure of commissionStructures) {
      try {
        const commission = new Commission(structure);
        await commission.save();
        console.log(`✓ Created: ${structure.operator} - ${structure.transactionType} (${structure.commissionType}: ${structure.commissionValue})`);
      } catch (error) {
        console.log(`✗ Failed to create: ${structure.operator} - ${structure.transactionType}: ${error.message}`);
      }
    }

    // Test 2: Test commission calculations
    console.log('\n--- Testing Commission Calculations ---');
    
    const testCases = [
      { operator: 'Airtel', transactionType: 'mobile-recharge', amount: 100 },
      { operator: 'Airtel', transactionType: 'mobile-recharge', amount: 500 },
      { operator: 'Jio', transactionType: 'mobile-recharge', amount: 200 },
      { operator: 'Tata Sky', transactionType: 'dth-recharge', amount: 300 },
      { operator: 'BSNL', transactionType: 'bill-payment', amount: 1000 },
      { operator: 'Vodafone', transactionType: 'mobile-recharge', amount: 150 }, // No commission structure
    ];

    for (const testCase of testCases) {
      const commission = await Commission.getCommissionRate(testCase.operator, testCase.transactionType);
      
      if (commission) {
        const commissionAmount = commission.calculateCommission(testCase.amount);
        console.log(`${testCase.operator} ${testCase.transactionType} ₹${testCase.amount}: Commission ₹${commissionAmount} (${commission.commissionType}: ${commission.commissionValue})`);
      } else {
        console.log(`${testCase.operator} ${testCase.transactionType} ₹${testCase.amount}: No commission structure found`);
      }
    }

    // Test 3: Test static method for commission calculation
    console.log('\n--- Testing Static Commission Calculation Method ---');
    
    const staticTestCases = [
      { operator: 'Airtel', transactionType: 'mobile-recharge', amount: 50 }, // Should use minCommission
      { operator: 'Airtel', transactionType: 'mobile-recharge', amount: 1000 }, // Should use maxCommission
      { operator: 'Jio', transactionType: 'mobile-recharge', amount: 99 },
    ];

    for (const testCase of staticTestCases) {
      const commissionAmount = await Commission.calculateCommissionAmount(
        testCase.operator,
        testCase.transactionType,
        testCase.amount
      );
      console.log(`${testCase.operator} ${testCase.transactionType} ₹${testCase.amount}: Commission ₹${commissionAmount}`);
    }

    // Test 4: Test transaction creation with commission
    console.log('\n--- Testing Transaction Creation with Commission ---');
    
    const testTransactions = [
      {
        type: 'mobile-recharge',
        amount: 200,
        metadata: {
          operator: 'Airtel',
          mobileNumber: '9876543210'
        }
      },
      {
        type: 'dth-recharge',
        amount: 500,
        metadata: {
          operator: 'Tata Sky',
          subscriberId: 'TS123456789'
        }
      }
    ];

    for (const txnData of testTransactions) {
      const operator = txnData.metadata.operator;
      const commission = await Commission.getCommissionRate(operator, txnData.type);
      
      let commissionAmount = 0;
      let commissionType = 'none';
      let commissionRate = 0;
      
      if (commission) {
        commissionAmount = commission.calculateCommission(txnData.amount);
        commissionType = commission.commissionType;
        commissionRate = commission.commissionValue;
      }
      
      console.log(`Transaction: ${txnData.type} - ${operator} - ₹${txnData.amount}`);
      console.log(`  Commission: ₹${commissionAmount} (${commissionType}: ${commissionRate})`);
    }

    // Test 5: List all commission structures
    console.log('\n--- All Commission Structures ---');
    const allCommissions = await Commission.find({ isActive: true }).sort({ operator: 1, transactionType: 1 });
    
    allCommissions.forEach(commission => {
      console.log(`${commission.operator} - ${commission.transactionType}:`);
      console.log(`  Type: ${commission.commissionType}`);
      console.log(`  Value: ${commission.commissionValue}`);
      console.log(`  Min: ₹${commission.minCommission}, Max: ${commission.maxCommission ? '₹' + commission.maxCommission : 'No limit'}`);
      console.log(`  Active: ${commission.isActive}`);
      console.log('');
    });

    console.log('\n=== Commission System Test Completed ===');

  } catch (error) {
    console.error('Error testing commission system:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the test
testCommissionSystem();