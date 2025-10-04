const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const operators = await OperatorConfig.find({serviceType: 'mobile'})
      .select('name code processingMode manualProcessing');
    
    console.log('\nMobile Operators Manual Processing Settings:');
    console.log('==========================================');
    
    operators.forEach((op, index) => {
      console.log(`${index + 1}. ${op.name} (${op.code})`);
      console.log(`   Processing Mode: ${op.processingMode}`);
      console.log(`   Manual Processing:`, op.manualProcessing);
      console.log('---');
    });
    
    // Update all mobile operators to require manual approval
    const updateResult = await OperatorConfig.updateMany(
      { serviceType: 'mobile' },
      { 
        $set: { 
          processingMode: 'manual',
          'manualProcessing.requiresApproval': true,
          'manualProcessing.approvalTimeout': 24
        }
      }
    );
    
    console.log(`\n✅ Updated ${updateResult.modifiedCount} mobile operators to require manual approval`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });