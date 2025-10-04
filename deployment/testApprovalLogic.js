const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');
require('dotenv').config();

async function testApprovalLogic() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/traepay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔍 Testing Approval Logic...');
    
    // Get all operators
    const operators = await OperatorConfig.find({ isActive: true });
    
    console.log(`\n📊 Found ${operators.length} active operators:\n`);
    
    // Test different amounts
    const testAmounts = [10, 50, 100, 200, 500];
    
    operators.forEach(operator => {
      console.log(`📱 ${operator.operatorName} (${operator.operatorCode})`);
      console.log(`   Processing Mode: ${operator.processingMode}`);
      console.log(`   Auto Approve Amount: ₹${operator.manualProcessing?.autoApproveAmount || 0}`);
      console.log(`   Requires Approval Setting: ${operator.manualProcessing?.requiresApproval}`);
      
      console.log('   Test Results:');
      testAmounts.forEach(amount => {
        const requiresApproval = operator.requiresManualApproval(amount);
        console.log(`     ₹${amount}: ${requiresApproval ? '❌ REQUIRES APPROVAL' : '✅ AUTO-APPROVE'}`);
      });
      
      console.log('   ---\n');
    });
    
    // Test the logic manually
    console.log('🧪 Manual Logic Test:');
    const testOperator = operators[0];
    if (testOperator) {
      console.log(`\nTesting with ${testOperator.operatorName}:`);
      console.log(`processingMode: ${testOperator.processingMode}`);
      console.log(`autoApproveAmount: ${testOperator.manualProcessing?.autoApproveAmount}`);
      console.log(`requiresApproval: ${testOperator.manualProcessing?.requiresApproval}`);
      
      const testAmount = 50;
      console.log(`\nFor amount ₹${testAmount}:`);
      console.log(`Step 1: processingMode !== 'manual'? ${testOperator.processingMode !== 'manual'} (if true, return false)`);
      console.log(`Step 2: autoApproveAmount > 0? ${testOperator.manualProcessing?.autoApproveAmount > 0} (if true, check amount > autoApproveAmount)`);
      if (testOperator.manualProcessing?.autoApproveAmount > 0) {
        console.log(`Step 3: amount (${testAmount}) > autoApproveAmount (${testOperator.manualProcessing.autoApproveAmount})? ${testAmount > testOperator.manualProcessing.autoApproveAmount}`);
      } else {
        console.log(`Step 3: Return requiresApproval: ${testOperator.manualProcessing?.requiresApproval}`);
      }
      
      const result = testOperator.requiresManualApproval(testAmount);
      console.log(`Final Result: ${result ? 'REQUIRES APPROVAL' : 'AUTO-APPROVE'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing approval logic:', error);
    process.exit(1);
  }
}

// Run test
testApprovalLogic();