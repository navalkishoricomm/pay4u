const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');
const ApiProvider = require('./models/ApiProvider');
require('dotenv').config();

async function debugOperatorLookup() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u');
    
    console.log('🔍 Debug: Testing getOperatorByCode method...');
    
    // Test the exact method used by rechargeService
    const operatorCode = 'AIRTEL';
    console.log(`Looking for operator: ${operatorCode}`);
    
    const operatorConfig = await OperatorConfig.getOperatorByCode(operatorCode);
    
    if (operatorConfig) {
      console.log('✅ Operator found!');
      console.log('- ID:', operatorConfig._id);
      console.log('- Code:', operatorConfig.operatorCode);
      console.log('- Name:', operatorConfig.operatorName);
      console.log('- Active:', operatorConfig.isActive);
      console.log('- Processing Mode:', operatorConfig.processingMode);
    } else {
      console.log('❌ Operator not found');
      
      // Let's check what's in the database
      console.log('\n🔍 Checking all operators in database...');
      const allOps = await OperatorConfig.find({});
      console.log(`Found ${allOps.length} operators:`);
      allOps.forEach(op => {
        console.log(`- ${op.operatorCode} (${op.operatorName}) - Active: ${op.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

debugOperatorLookup();