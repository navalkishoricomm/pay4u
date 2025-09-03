const mongoose = require('mongoose');
const ApiProvider = require('./models/ApiProvider');
require('dotenv').config();

async function checkApiProviders() {
  try {
    console.log('Connecting to production database...');
    await mongoose.connect('mongodb://localhost:27017/pay4u_production');
    console.log('Connected successfully');
    
    const providers = await ApiProvider.find({});
    console.log('\nTotal API Providers found:', providers.length);
    
    if (providers.length === 0) {
      console.log('No API providers found in production database');
    } else {
      providers.forEach((p, i) => {
        console.log(`\nProvider ${i+1}:`);
        console.log('  Name:', p.name);
        console.log('  Active:', p.isActive);
        console.log('  Environment:', p.environment);
        console.log('  Base URL:', p.baseUrl);
        console.log('  Has Endpoints:', !!p.endpoints);
        if (p.endpoints) {
          console.log('  Endpoint Keys:', Object.keys(p.endpoints));
        }
      });
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkApiProviders();