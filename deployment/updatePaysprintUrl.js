require('dotenv/config');
const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u';
console.log('Updating Paysprint base URL...');

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find Paysprint provider
    const paysprintProvider = await ApiProvider.findOne({ name: 'paysprint' });
    
    if (!paysprintProvider) {
      console.log('❌ Paysprint provider not found');
      return;
    }
    
    console.log('\n=== CURRENT PAYSPRINT CONFIG ===');
    console.log('Current Base URL:', paysprintProvider.baseUrl);
    
    // Update with correct production URL
    const newBaseUrl = 'https://api.paysprint.in/service-api/api/v1/service';
    paysprintProvider.baseUrl = newBaseUrl;
    
    await paysprintProvider.save();
    
    console.log('\n=== UPDATED PAYSPRINT CONFIG ===');
    console.log('New Base URL:', paysprintProvider.baseUrl);
    console.log('✅ Paysprint base URL updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating Paysprint URL:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}).catch(error => {
  console.error('MongoDB connection failed:', error);
  process.exit(1);
});