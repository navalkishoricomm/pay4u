const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkOperators() {
  try {
    console.log('Checking operators in database...');
    
    const operators = await OperatorConfig.find({});
    console.log(`Total operators found: ${operators.length}`);
    
    if (operators.length > 0) {
      console.log('\nOperators:');
      operators.forEach(op => {
        console.log(`- ${op.operatorName} (${op.operatorCode}) - ${op.serviceType} - Active: ${op.isActive}`);
      });
    } else {
      console.log('No operators found in database!');
      console.log('You need to seed operators data.');
    }
    
    const mobileOperators = await OperatorConfig.find({ serviceType: 'mobile', isActive: true });
    console.log(`\nActive mobile operators: ${mobileOperators.length}`);
    
    const dthOperators = await OperatorConfig.find({ serviceType: 'dth', isActive: true });
    console.log(`Active DTH operators: ${dthOperators.length}`);
    
  } catch (error) {
    console.error('Error checking operators:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkOperators();