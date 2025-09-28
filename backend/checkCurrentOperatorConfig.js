const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');
require('dotenv').config();

async function checkOperatorConfig() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/traepay4u', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    console.log('🔍 Checking Current Operator Configurations...');
    
    const operators = await OperatorConfig.find({});
    
    console.log(`\n📊 Found ${operators.length} active operators:\n`);
    
    operators.forEach(operator => {
      console.log(`📱 ${operator.operatorName} (${operator.operatorCode})`);
      console.log(`   Processing Mode: ${operator.processingMode}`);
      console.log(`   Auto Approve Amount: ₹${operator.manualProcessing?.autoApproveAmount || 0}`);
      console.log(`   Requires Approval: ${operator.manualProcessing?.requiresApproval}`);
      console.log(`   Status: ${operator.isActive ? 'Active' : 'Inactive'}`);
      
      // Check if this operator will auto-approve
      const testAmount = 50; // Test with ₹50
      const willAutoApprove = operator.processingMode === 'manual' && 
                             operator.manualProcessing?.autoApproveAmount > 0 && 
                             testAmount <= operator.manualProcessing.autoApproveAmount;
      
      console.log(`   Will Auto-Approve ₹${testAmount}?: ${willAutoApprove ? '✅ YES' : '❌ NO'}`);
      console.log('   ---');
    });
    
    console.log('\n🎯 Analysis:');
    const autoApproveOperators = operators.filter(op => 
      op.processingMode === 'manual' && 
      op.manualProcessing?.autoApproveAmount > 0
    );
    
    if (autoApproveOperators.length > 0) {
      console.log(`⚠️  ${autoApproveOperators.length} operators have auto-approve amounts set`);
      console.log('   This is why recharges are not going to admin approval!');
    } else {
      console.log('✅ All operators require manual approval');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkOperatorConfig();