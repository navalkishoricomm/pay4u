const mongoose = require('mongoose');
const OperatorConfig = require('./models/OperatorConfig');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const operators = await OperatorConfig.find({serviceType: 'mobile'})
      .select('name minAmount maxAmount serviceType');
    
    console.log('\nMobile Operators:');
    console.log('================');
    
    if (operators.length === 0) {
      console.log('No mobile operators found');
    } else {
      operators.forEach(op => {
        console.log(`${op.name}: Min=Rs.${op.minAmount}, Max=Rs.${op.maxAmount}`);
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });