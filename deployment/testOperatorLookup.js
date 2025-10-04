const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');
const ApiProvider = require('./models/ApiProvider');
require('dotenv').config();

async function testOperatorLookup() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u');
    
    console.log('🔍 Listing all operators in database...');
    
    // Get all operators to see their exact field values
    const allOperators = await OperatorConfig.find({});
    
    console.log(`Found ${allOperators.length} total operators:`);
    for (const op of allOperators) {
      console.log('---');
      console.log('ID:', op._id);
      console.log('operatorCode:', JSON.stringify(op.operatorCode));
      console.log('operatorName:', JSON.stringify(op.operatorName));
      console.log('serviceType:', JSON.stringify(op.serviceType));
      console.log('isActive:', op.isActive);
      console.log('processingMode:', JSON.stringify(op.processingMode));
    }
    
    console.log('\n🔍 Testing operator lookup with different codes...');
    
    const testCodes = ['AIRTEL', 'airtel', 'Airtel'];
    
    for (const code of testCodes) {
      console.log(`\nTesting code: "${code}"`);
      const operatorConfig = await OperatorConfig.getOperatorByCode(code);
      console.log('Result:', operatorConfig ? 'Found' : 'Not found');
      
      if (operatorConfig) {
        console.log('- Code:', operatorConfig.operatorCode);
        console.log('- Name:', operatorConfig.operatorName);
      }
    }
    
    // Test direct query with exact values from database
    if (allOperators.length > 0) {
      const firstOp = allOperators[0];
      console.log(`\n🔍 Testing direct query with exact operatorCode: "${firstOp.operatorCode}"`);
      
      const directQuery = await OperatorConfig.findOne({
        operatorCode: firstOp.operatorCode,
        isActive: true
      });
      
      console.log('Direct query result:', directQuery ? 'Found' : 'Not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testOperatorLookup();