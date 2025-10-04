const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // First, let's see all mobile operators
    const operators = await OperatorConfig.find({serviceType: 'mobile'});
    
    console.log('\nCurrent Mobile Operators:');
    console.log('========================');
    
    operators.forEach((op, index) => {
      console.log(`${index + 1}. Name: ${op.name || op.operatorName || 'N/A'}`);
      console.log(`   Code: ${op.code || op.operatorCode || 'N/A'}`);
      console.log(`   Min: Rs.${op.minAmount}, Max: Rs.${op.maxAmount}`);
      console.log('---');
    });
    
    // Update all mobile operators to have max amount of 10000
    const updateResult = await OperatorConfig.updateMany(
      { serviceType: 'mobile' },
      { 
        $set: { 
          minAmount: 1,
          maxAmount: 10000 
        }
      }
    );
    
    console.log(`\n✅ Updated ${updateResult.modifiedCount} mobile operators`);
    console.log('New limits: Min=Rs.1, Max=Rs.10000');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });