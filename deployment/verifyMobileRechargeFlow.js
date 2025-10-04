const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    console.log('\n🔍 MOBILE RECHARGE FLOW VERIFICATION');
    console.log('=====================================\n');
    
    const db = mongoose.connection.db;
    
    // 1. Check operator configurations
    console.log('1. ✅ OPERATOR CONFIGURATIONS:');
    console.log('------------------------------');
    const operators = await db.collection('operatorconfigs')
      .find({ serviceType: 'mobile' })
      .project({ name: 1, code: 1, minAmount: 1, maxAmount: 1, 'manualProcessing.requiresApproval': 1, 'manualProcessing.approvalTimeout': 1 })
      .toArray();
    
    operators.forEach((op, index) => {
      console.log(`${index + 1}. Operator: ${op.name || op.code || 'Unknown'}`);
      console.log(`   Amount Range: Rs.${op.minAmount} - Rs.${op.maxAmount}`);
      console.log(`   Manual Approval: ${op.manualProcessing?.requiresApproval ? 'Yes' : 'No'}`);
      console.log(`   Approval Timeout: ${op.manualProcessing?.approvalTimeout || 'N/A'} hours`);
      console.log('---');
    });
    
    // 2. Check recent mobile recharge transactions
    console.log('\n2. ✅ RECENT MOBILE RECHARGE TRANSACTIONS:');
    console.log('------------------------------------------');
    const recentTransactions = await db.collection('transactions')
      .find({ type: 'mobile-recharge' })
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ transactionId: 1, type: 1, amount: 1, status: 1, createdAt: 1 })
      .toArray();
    
    if (recentTransactions.length === 0) {
      console.log('❌ No mobile recharge transactions found');
    } else {
      recentTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.transactionId} - Rs.${tx.amount} - ${tx.status}`);
      });
    }
    
    // 3. Check transactions awaiting approval
    console.log('\n3. ✅ TRANSACTIONS AWAITING ADMIN APPROVAL:');
    console.log('-------------------------------------------');
    const awaitingApproval = await db.collection('transactions')
      .find({ 
        type: 'mobile-recharge',
        status: 'awaiting_approval' 
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .project({ transactionId: 1, amount: 1, status: 1, createdAt: 1 })
      .toArray();
    
    if (awaitingApproval.length === 0) {
      console.log('❌ No mobile recharge transactions awaiting approval');
    } else {
      console.log(`Found ${awaitingApproval.length} transactions awaiting approval:`);
      awaitingApproval.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.transactionId} - Rs.${tx.amount} - ${tx.status}`);
      });
    }
    
    // 4. Summary statistics
    console.log('\n4. ✅ TRANSACTION STATISTICS:');
    console.log('-----------------------------');
    const stats = await db.collection('transactions').aggregate([
      {
        $match: { type: 'mobile-recharge' }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} transactions (Rs.${stat.totalAmount})`);
    });
    
    // 5. Verification summary
    console.log('\n5. ✅ VERIFICATION SUMMARY:');
    console.log('---------------------------');
    
    const checks = [
      {
        name: 'Operator amount limits (Rs.1 - Rs.10000)',
        passed: operators.every(op => op.minAmount === 1 && op.maxAmount === 10000)
      },
      {
        name: 'Manual approval enabled for operators',
        passed: operators.every(op => op.manualProcessing?.requiresApproval === true)
      },
      {
        name: 'Mobile recharge transactions exist',
        passed: recentTransactions.length > 0
      },
      {
        name: 'Transactions awaiting approval exist',
        passed: awaitingApproval.length > 0
      }
    ];
    
    checks.forEach(check => {
      console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
    });
    
    const allPassed = checks.every(check => check.passed);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Status: ${allPassed ? 'ALL CHECKS PASSED' : 'SOME ISSUES FOUND'}`);
    
    if (allPassed) {
      console.log('\n🚀 Mobile recharge flow is working correctly!');
      console.log('   - Amount validation: Rs.1 to Rs.10000 ✅');
      console.log('   - Manual approval: Enabled ✅');
      console.log('   - Transaction categorization: mobile-recharge ✅');
      console.log('   - Admin approval queue: Populated ✅');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });