const mongoose = require('mongoose');
require('dotenv').config();

const checkBothDatabases = async () => {
  try {
    console.log('=== CHECKING BOTH DATABASES ===\n');
    
    // Check pay4u database
    console.log('1. Checking pay4u database...');
    await mongoose.connect('mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('   ✅ Connected to pay4u');
    
    // Check collections and admin user in pay4u
    const collections1 = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections: ${collections1.length}`);
    
    try {
      const User = require('./models/User');
      const adminUser1 = await User.findOne({ role: 'admin' });
      if (adminUser1) {
        console.log(`   ✅ Admin user found: ${adminUser1.email}`);
      } else {
        console.log('   ❌ No admin user found');
      }
    } catch (error) {
      console.log(`   ❌ Error checking admin: ${error.message}`);
    }
    
    await mongoose.connection.close();
    
    // Check pay4u_production database
    console.log('\n2. Checking pay4u_production database...');
    try {
      await mongoose.connect('mongodb://localhost:27017/pay4u_production', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log('   ✅ Connected to pay4u_production');
      
      // Check collections and admin user in pay4u_production
      const collections2 = await mongoose.connection.db.listCollections().toArray();
      console.log(`   Collections: ${collections2.length}`);
      
      try {
        const adminUser2 = await User.findOne({ role: 'admin' });
        if (adminUser2) {
          console.log(`   ✅ Admin user found: ${adminUser2.email}`);
        } else {
          console.log('   ❌ No admin user found');
        }
      } catch (error) {
        console.log(`   ❌ Error checking admin: ${error.message}`);
      }
      
      await mongoose.connection.close();
      
    } catch (error) {
      console.log(`   ❌ Cannot connect to pay4u_production: ${error.message}`);
    }
    
    // Show current server configuration
    console.log('\n3. Current Server Configuration:');
    console.log(`   MONGO_URI: ${process.env.MONGO_URI || 'Not set'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    
    // Show what the server would use
    const serverConnectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u';
    const serverDbName = serverConnectionString.split('/').pop().split('?')[0];
    console.log(`   Server uses database: ${serverDbName}`);
    
    console.log('\n4. Recommendation:');
    if (serverDbName === 'pay4u_production') {
      console.log('   Your server is configured to use pay4u_production database.');
      console.log('   Run: node scripts/resetAdminPassword.js');
    } else {
      console.log('   Your server is configured to use pay4u database.');
      console.log('   If you want to use pay4u_production, update MONGO_URI in .env file.');
      console.log('   Or run: MONGODB_URI="mongodb://localhost:27017/pay4u_production" node scripts/resetAdminPassword.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
};

// Run the check
checkBothDatabases();}