const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

async function updateApiProvider() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pay4u');
    
    const result = await ApiProvider.updateOne(
      { name: 'paysprint' },
      { 
        $set: { 
          testMode: false, 
          displayName: 'Paysprint Production' 
        } 
      }
    );
    
    console.log('Updated API Provider:', result);
    
    const updated = await ApiProvider.findOne({ name: 'paysprint' });
    console.log('Test Mode:', updated.testMode);
    console.log('Display Name:', updated.displayName);
    
    await mongoose.disconnect();
    console.log('✅ API Provider updated successfully');
  } catch (error) {
    console.error('❌ Error updating API Provider:', error);
    process.exit(1);
  }
}

updateApiProvider();