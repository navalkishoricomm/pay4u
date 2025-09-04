const mongoose = require('mongoose');
require('dotenv').config();

const checkDatabaseConnection = async () => {
  try {
    console.log('=== DATABASE CONNECTION INFORMATION ===\n');
    
    // Show environment variables
    console.log('1. Environment Variables:');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'Not set');
    console.log('   MONGO_URI:', process.env.MONGO_URI || 'Not set');
    console.log('   MONGODB_URI:', process.env.MONGODB_URI || 'Not set');
    
    // Show the actual connection string that will be used
    const connectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u';
    console.log('\n2. Connection String Being Used:');
    console.log('   ', connectionString);
    
    // Extract database name from connection string
    const dbName = connectionString.split('/').pop().split('?')[0];
    console.log('\n3. Database Name:');
    console.log('   ', dbName);
    
    // Connect to MongoDB
    console.log('\n4. Connecting to MongoDB...');
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('   ✅ Connected successfully!');
    
    // Show actual connection details
    console.log('\n5. Actual Connection Details:');
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port);
    console.log('   Database Name:', mongoose.connection.name);
    console.log('   Connection State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    
    // List collections in the database
    console.log('\n6. Collections in Database:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length > 0) {
      collections.forEach((collection, index) => {
        console.log(`   ${index + 1}. ${collection.name}`);
      });
    } else {
      console.log('   No collections found');
    }
    
    // Check for admin user
    console.log('\n7. Admin User Check:');
    try {
      const User = require('./models/User');
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        console.log('   ✅ Admin user found:', adminUser.email);
      } else {
        console.log('   ❌ No admin user found');
      }
    } catch (error) {
      console.log('   ❌ Error checking admin user:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n8. Database connection closed.');
    process.exit(0);
  }
};

// Run the check
checkDatabaseConnection();